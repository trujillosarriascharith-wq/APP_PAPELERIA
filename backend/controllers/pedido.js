import {
  crearPedido,
  obtenerPedidoConDetalles,
  obtenerPedidosPorUsuario,
  crearDetallePedido,
  eliminarPedido,
  obtenerProductosPorIds,
} from '../models/pedido.js';
import {
  obtenerCarritoConProductosParaPedido,
  vaciarCarritoPorUsuario,
  quitarProductosDelCarrito,
} from '../models/carrito.js';
import { descontarStockPedido, devolverStockPedido } from '../models/producto.js';
import { obtenerComprobantePorId, marcarComprobanteUsado } from '../models/comprobantes.js';
import { obtenerUsuarioPorId } from '../models/user.js';
import { enviarConfirmacionPedido } from '../utils/sendEmail.js';
import { notificar, notificarAdmins } from '../utils/notificar.js';

const idDelToken = (req) => req.usuario.id_usuario || req.usuario.id;
const pesos = (n) => `$${Number(n).toLocaleString('es-CO')}`;

// Tareas posteriores al pedido: si fallan, el pedido ya creado NO se pierde
const despues = async (nombre, tarea) => {
  try {
    await tarea();
  } catch (e) {
    console.error(`Error en tarea posterior (${nombre}):`, e);
  }
};

// Descuenta el stock de todo el pedido (todo o nada).
// Devuelve null si salió bien, o { status, error } con el motivo.
const reservarStock = async (items) => {
  const { error } = await descontarStockPedido(items);
  if (!error) return null;

  const m = String(error.message || '');
  if (m.includes('SIN_STOCK')) {
    const [, nombre, disponible] = m.split('|');
    return {
      status: 409,
      error: Number(disponible) === 0
        ? `${nombre} está agotado`
        : `Solo quedan ${disponible} de ${nombre}`,
    };
  }
  if (m.includes('PRODUCTO_NO_EXISTE')) {
    return { status: 400, error: 'Uno de los productos ya no existe' };
  }
  return { status: 500, error: `Error al reservar el stock: ${m}` };
};

const enviarCorreo = (id_usuario, id_pedido, total) =>
  despues('correo', async () => {
    const { data: usuario } = await obtenerUsuarioPorId(id_usuario);
    if (usuario) await enviarConfirmacionPedido(usuario.email, usuario.nombre, id_pedido, total);
  });

const notificarPedido = (id_usuario, id_pedido, resumen, total, metodo) =>
  despues('notificaciones', async () => {
    const productos = resumen.map((r) => `${r.cantidad} x ${r.nombre}`).join(', ');
    await notificar(
      id_usuario,
      `Pedido #${id_pedido} realizado: ${productos}. Total: ${pesos(total)}. Método de pago: ${metodo}.`
    );
    await notificarAdmins(`Nuevo pedido #${id_pedido} por ${pesos(total)}. Método de pago: ${metodo}.`);
  });

// Crear pedido con detalles (lo usa la app Flutter)
export const crearPedidoConDetalles = async (req, res) => {
  let itemsStock = null;
  let stockReservado = false;
  let pedidoCreado = false;

  try {
    const id_usuario = idDelToken(req);
    const { direccion, telefono, detalles, metodo_pago, id_comprobante } = req.body || {};
    console.log('📥 CREAR PEDIDO:', { id_usuario, metodo_pago, id_comprobante, items: detalles?.length });

    if (!Array.isArray(detalles) || detalles.length === 0) {
      return res.status(400).json({ error: 'El pedido no tiene productos' });
    }
    if (!direccion || !telefono) {
      return res.status(400).json({ error: 'La dirección y el teléfono son requeridos' });
    }

    // Los precios y nombres salen de la base de datos, no del celular
    const ids = detalles.map((d) => Number(d.id_producto));
    const { data: productos, error: errorProd } = await obtenerProductosPorIds(ids);
    if (errorProd) {
      return res.status(500).json({
        error: `Error al consultar los productos: ${errorProd.message}`,
        detalle: errorProd.message,
      });
    }

    const lineas = [];
    const resumen = [];
    let total = 0;
    for (const d of detalles) {
      const id_producto = Number(d.id_producto);
      const cantidad = Number(d.cantidad);
      const prod = (productos || []).find((p) => Number(p.id_producto) === id_producto);
      if (!prod) {
        return res.status(400).json({ error: `El producto ${id_producto} ya no existe` });
      }
      if (!Number.isInteger(cantidad) || cantidad <= 0) {
        return res.status(400).json({ error: `Cantidad inválida para ${prod.nombre}` });
      }
      const precio = Number(prod.precio);
      const subtotal = precio * cantidad;
      total += subtotal;
      // La tabla detalle_pedido usa la columna "subtotal"
      lineas.push({ id_producto, cantidad, precio, subtotal });
      resumen.push({ nombre: prod.nombre, cantidad });
    }

    // Nequi: exige un comprobante propio, aprobado y sin usar
    const esNequi = String(metodo_pago || '').toLowerCase() === 'nequi';
    if (esNequi) {
      const { data: comp } = id_comprobante
        ? await obtenerComprobantePorId(id_comprobante)
        : { data: null };
      if (!comp || comp.id_usuario !== id_usuario || comp.estado !== 'aprobado' || comp.usado) {
        return res.status(400).json({
          error: 'Para pagar con Nequi necesitas un comprobante aprobado por el administrador',
        });
      }
    }

    // Descuenta el stock. Si otro usuario ya se llevó las piezas, se rechaza aquí.
    itemsStock = lineas.map((l) => ({ id_producto: l.id_producto, cantidad: l.cantidad }));
    const problemaStock = await reservarStock(itemsStock);
    if (problemaStock) {
      return res.status(problemaStock.status).json({ error: problemaStock.error });
    }
    stockReservado = true;

    const { data: pedido, error: errorPedido } = await crearPedido({
      id_usuario, direccion, telefono, total, estado: 'pendiente', fecha: new Date(),
    });
    if (errorPedido) {
      console.log(errorPedido);
      await devolverStockPedido(itemsStock);
      stockReservado = false;
      return res.status(500).json({
        error: `Error al crear el pedido: ${errorPedido.message}`,
        detalle: errorPedido.message,
      });
    }
    const id_pedido = pedido[0].id_pedido;

    for (const l of lineas) {
      const { error } = await crearDetallePedido({ id_pedido, ...l });
      if (error) {
        console.log(error);
        await eliminarPedido(id_pedido); // no dejar un pedido a medias
        await devolverStockPedido(itemsStock);
        stockReservado = false;
        return res.status(500).json({
          error: `Error al guardar los productos del pedido: ${error.message}`,
          detalle: error.message,
        });
      }
    }
    pedidoCreado = true;

    // A partir de aquí el pedido ya existe: nada de lo siguiente puede tumbarlo
    if (esNequi) {
      await despues('marcar comprobante', async () => {
        const { error } = await marcarComprobanteUsado(id_comprobante, id_pedido);
        if (error) console.log('No se pudo marcar el comprobante:', error.message);
      });
    }
    await despues('limpiar carrito', async () => {
      const { error } = await quitarProductosDelCarrito(id_usuario, lineas.map((l) => l.id_producto));
      if (error) console.log('No se pudo limpiar el carrito:', error.message);
    });

    notificarPedido(id_usuario, id_pedido, resumen, total, esNequi ? 'Nequi' : 'Efectivo');
    enviarCorreo(id_usuario, id_pedido, total);

    return res.status(201).json({ message: 'Pedido creado', pedido: pedido[0], total });
  } catch (error) {
    console.error('Error en crear pedido:', error);
    // Si el stock ya se descontó y el pedido no llegó a existir, se devuelve
    if (stockReservado && !pedidoCreado && itemsStock) {
      await despues('devolver stock', () => devolverStockPedido(itemsStock));
    }
    return res.status(500).json({
      error: `Error en el servidor: ${error.message}`,
      detalle: error.message,
    });
  }
};

// Crear pedido con todo lo que hay en el carrito guardado
export const crearPedidoDesdeCarrito = async (req, res) => {
  try {
    const id_usuario = idDelToken(req);
    const { direccion, telefono } = req.body || {};

    const { data: carrito, error: errorCarrito } = await obtenerCarritoConProductosParaPedido(id_usuario);
    if (errorCarrito) return res.status(500).json({ error: 'Error al leer el carrito', detalle: errorCarrito.message });
    if (!carrito || carrito.length === 0) return res.status(400).json({ error: 'El carrito está vacío' });

    let total = 0;
    carrito.forEach((item) => { total += Number(item.producto.precio) * Number(item.cantidad); });

    // Descuenta el stock; si no alcanza, se rechaza el pedido
    const itemsStock = carrito.map((i) => ({
      id_producto: i.id_producto,
      cantidad: Number(i.cantidad),
    }));
    const problemaStock = await reservarStock(itemsStock);
    if (problemaStock) {
      return res.status(problemaStock.status).json({ error: problemaStock.error });
    }

    const { data: pedido, error } = await crearPedido({
      id_usuario, direccion, telefono, total, estado: 'pendiente', fecha: new Date(),
    });
    if (error) {
      await devolverStockPedido(itemsStock);
      return res.status(500).json({ error: 'Error al crear el pedido', detalle: error.message });
    }
    const id_pedido = pedido[0].id_pedido;

    for (const item of carrito) {
      await crearDetallePedido({
        id_pedido,
        id_producto: item.id_producto,
        cantidad: item.cantidad,
        precio: item.producto.precio,
        subtotal: Number(item.producto.precio) * Number(item.cantidad),
      });
    }
    await despues('vaciar carrito', () => vaciarCarritoPorUsuario(id_usuario));

    notificarPedido(
      id_usuario, id_pedido,
      carrito.map((i) => ({ nombre: i.producto.nombre, cantidad: i.cantidad })),
      total, 'por confirmar'
    );
    enviarCorreo(id_usuario, id_pedido, total);

    return res.status(201).json({ message: 'Pedido creado desde carrito', pedido: pedido[0], total });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const obtenerPedidoUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await obtenerPedidoConDetalles(id);
    if (error || !data) return res.status(404).json({ error: 'Pedido no encontrado' });
    return res.status(200).json(data);
  } catch (error) { return res.status(500).json({ error: error.message }); }
};

// Los pedidos del usuario que inició sesión (el id sale del token)
export const misPedidos = async (req, res) => {
  try {
    const id_usuario = idDelToken(req);
    const { data, error } = await obtenerPedidosPorUsuario(id_usuario);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  } catch (error) { return res.status(500).json({ error: error.message }); }
};