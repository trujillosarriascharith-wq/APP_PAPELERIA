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
import { obtenerComprobantePorId, marcarComprobanteUsado } from '../models/comprobantes.js';
import { obtenerUsuarioPorId } from '../models/user.js';
import { enviarConfirmacionPedido } from '../utils/sendEmail.js';
import { notificar } from '../utils/notificar.js';

const idDelToken = (req) => req.usuario.id_usuario || req.usuario.id;
const pesos = (n) => `$${Number(n).toLocaleString('es-CO')}`;

// El correo se manda sin hacer esperar la respuesta a la app
const enviarCorreo = (id_usuario, id_pedido, total) => {
  obtenerUsuarioPorId(id_usuario)
    .then(({ data: usuario }) =>
      usuario ? enviarConfirmacionPedido(usuario.email, usuario.nombre, id_pedido, total) : null)
    .catch((e) => console.log('Error correo:', e.message));
};

// Notificación para el cliente con el resumen del pedido
const notificarPedido = (id_usuario, id_pedido, resumen, total, metodo) => {
  const productos = resumen.map((r) => `${r.cantidad} x ${r.nombre}`).join(', ');
  notificar(
    id_usuario,
    `Pedido #${id_pedido} realizado: ${productos}. Total: ${pesos(total)}. Método de pago: ${metodo}.`
  );
};

// Crear pedido con detalles (lo usa la app Flutter)
export const crearPedidoConDetalles = async (req, res) => {
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
      return res.status(500).json({ error: 'Error al consultar los productos', detalle: errorProd.message });
    }

    const lineas = [];
    const resumen = [];
    let total = 0;
    for (const d of detalles) {
      const id_producto = Number(d.id_producto);
      const cantidad = Number(d.cantidad);
      const prod = productos.find((p) => p.id_producto === id_producto);
      if (!prod) {
        return res.status(400).json({ error: `El producto ${id_producto} ya no existe` });
      }
      if (!Number.isInteger(cantidad) || cantidad <= 0) {
        return res.status(400).json({ error: `Cantidad inválida para ${prod.nombre}` });
      }
      const precio = Number(prod.precio);
      const subtotal = precio * cantidad;
      total += subtotal;
      lineas.push({ id_producto, cantidad, precio, total_parcial: subtotal });
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

    const { data: pedido, error: errorPedido } = await crearPedido({
      id_usuario, direccion, telefono, total, estado: 'pendiente', fecha: new Date(),
    });
    if (errorPedido) {
      console.log(errorPedido);
      return res.status(500).json({ error: 'Error al crear el pedido', detalle: errorPedido.message });
    }
    const id_pedido = pedido[0].id_pedido;

    for (const l of lineas) {
      const { error } = await crearDetallePedido({ id_pedido, ...l });
      if (error) {
        console.log(error);
        await eliminarPedido(id_pedido); // no dejar un pedido a medias
        return res.status(500).json({ error: 'Error al guardar los productos del pedido', detalle: error.message });
      }
    }

    if (esNequi) await marcarComprobanteUsado(id_comprobante, id_pedido);

    // Los productos pedidos salen del carrito guardado
    await quitarProductosDelCarrito(id_usuario, lineas.map((l) => l.id_producto));

    notificarPedido(id_usuario, id_pedido, resumen, total, esNequi ? 'Nequi' : 'Efectivo');
    enviarCorreo(id_usuario, id_pedido, total);

    return res.status(201).json({ message: 'Pedido creado', pedido: pedido[0], total });
  } catch (error) {
    console.error('Error en crear pedido:', error);
    return res.status(500).json({ error: 'Error en el servidor', detalle: error.message });
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

    const { data: pedido, error } = await crearPedido({
      id_usuario, direccion, telefono, total, estado: 'pendiente', fecha: new Date(),
    });
    if (error) return res.status(500).json({ error: 'Error al crear el pedido', detalle: error.message });
    const id_pedido = pedido[0].id_pedido;

    for (const item of carrito) {
      await crearDetallePedido({
        id_pedido,
        id_producto: item.id_producto,
        cantidad: item.cantidad,
        precio: item.producto.precio,
        total_parcial: Number(item.producto.precio) * Number(item.cantidad),
      });
    }
    await vaciarCarritoPorUsuario(id_usuario);

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

export const misPedidos = async (req, res) => {
  try {
    const { id_usuario } = req.query;
    if (!id_usuario) return res.status(400).json({ error: 'id_usuario requerido' });
    const { data, error } = await obtenerPedidosPorUsuario(id_usuario);
    return res.status(200).json(data);
  } catch (error) { return res.status(500).json({ error: error.message }); }
};