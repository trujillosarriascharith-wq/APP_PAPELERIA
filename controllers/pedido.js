import { crearPedido, obtenerPedidoConDetalles, obtenerPedidosPorUsuario, crearDetallePedido, eliminarPedido } from '../models/pedido.js';
import { obtenerCarritoConProductosParaPedido, vaciarCarritoPorUsuario, quitarProductosDelCarrito } from '../models/carrito.js';
import { obtenerUsuarioPorId } from '../models/user.js';
import { descontarStockAtomico, reponerStockAtomico, obtenerProductoPorId } from '../models/producto.js';
import { enviarConfirmacionPedido } from '../utils/sendEmail.js';

// Devuelve al inventario las piezas de los items indicados
const devolverStock = async (items) => {
  for (const it of items) {
    const { error } = await reponerStockAtomico(it.id_producto, it.cantidad);
    if (error) console.error(`No se pudo devolver el stock del producto ${it.id_producto}:`, error.message);
  }
};

// Descuenta el stock de todos los items. Si alguno no alcanza,
// devuelve lo que ya se había descontado y avisa cuál falló.
const reservarStock = async (items) => {
  const descontados = [];
  for (const it of items) {
    const { stock, error } = await descontarStockAtomico(it.id_producto, it.cantidad);

    if (error || stock === null || stock === undefined) {
      if (error) console.error('Error al descontar stock:', error.message);
      await devolverStock(descontados);

      let nombre = `el producto ${it.id_producto}`;
      let disponibles = 0;
      const { data: prod } = await obtenerProductoPorId(it.id_producto);
      if (prod) {
        nombre = `"${prod.nombre}"`;
        disponibles = prod.cantidad_stock;
      }

      let mensaje;
      if (error) mensaje = `No se pudo verificar el stock de ${nombre}`;
      else if (disponibles > 0) mensaje = `No hay suficientes piezas de ${nombre}. Disponibles: ${disponibles}`;
      else mensaje = `${nombre} está agotado`;

      return { ok: false, mensaje };
    }
    descontados.push(it);
  }
  return { ok: true };
};

export const crearPedidoConDetalles = async (req, res) => {
  let reservado = []; // lo que se descontó del inventario, por si hay que deshacerlo
  try {
    // El id del usuario viene del token, no del body
    const id_usuario = req.usuario?.id_usuario ?? req.usuario?.id;
    const { direccion, telefono, detalles } = req.body;

    if (!id_usuario) return res.status(401).json({ error: 'No se pudo identificar al usuario' });
    if (!detalles || detalles.length === 0) return res.status(400).json({ error: 'Datos incompletos' });

    const items = detalles.map(d => ({
      id_producto: Number(d.id_producto),
      cantidad: Number(d.cantidad)
    }));
    for (const it of items) {
      if (!it.id_producto || !Number.isInteger(it.cantidad) || it.cantidad <= 0) {
        return res.status(400).json({ error: 'Producto o cantidad inválidos en el pedido' });
      }
    }

    let total = 0;
    detalles.forEach(d => { total += Number(d.subtotal || d.total_parcial); });

    // 1) Descontar el stock (si no alcanza, no se crea nada)
    const reserva = await reservarStock(items);
    if (!reserva.ok) return res.status(409).json({ error: reserva.mensaje });
    reservado = items;

    // 2) Crear el pedido
    const { data: pedido, error: errorPedido } = await crearPedido({ id_usuario, direccion, telefono, total, estado: 'pendiente', fecha: new Date() });
    if (errorPedido) {
      await devolverStock(items);
      reservado = [];
      return res.status(500).json({ error: errorPedido.message });
    }

    // 3) Crear los detalles
    const id_pedido_creado = pedido[0].id_pedido;
    for (let d of detalles) {
      const { error: errorDetalle } = await crearDetallePedido({
        id_pedido: id_pedido_creado,
        id_producto: d.id_producto,
        cantidad: d.cantidad,
        precio: d.precio_unitario || d.precio,
        total_parcial: d.subtotal || d.total_parcial
      });
      if (errorDetalle) {
        await eliminarPedido(id_pedido_creado);
        await devolverStock(items);
        reservado = [];
        return res.status(500).json({ error: errorDetalle.message });
      }
    }

    // 4) Quitar del carrito guardado los productos que ya se compraron
    try {
      await quitarProductosDelCarrito(id_usuario, items.map(i => i.id_producto));
    } catch (e) {
      console.log('No se pudo limpiar el carrito:', e.message);
    }

    reservado = [];
    return res.status(201).json({ message: 'Pedido creado', pedido: pedido[0] });
  } catch (error) {
    if (reservado.length) await devolverStock(reservado);
    return res.status(500).json({ error: error.message });
  }
};

export const crearPedidoDesdeCarrito = async (req, res) => {
  let reservado = [];
  try {
    const { id_usuario, direccion, telefono } = req.body;
    if (!id_usuario) return res.status(400).json({ error: 'id_usuario requerido' });
    const { data: carrito, error: errorCarrito } = await obtenerCarritoConProductosParaPedido(id_usuario);
    if (errorCarrito) return res.status(500).json({ error: errorCarrito });
    if (!carrito || carrito.length === 0) return res.status(400).json({ error: 'El carrito está vacío' });
    let total = 0;
    carrito.forEach(item => { total += Number(item.producto.precio) * Number(item.cantidad); });

    // Descontar el stock (si no alcanza, no se crea nada)
    const items = carrito.map(i => ({ id_producto: i.id_producto, cantidad: Number(i.cantidad) }));
    const reserva = await reservarStock(items);
    if (!reserva.ok) return res.status(409).json({ error: reserva.mensaje });
    reservado = items;

    const { data: pedido, error } = await crearPedido({ id_usuario, direccion, telefono, total, estado: 'pendiente', fecha: new Date() });
    if (error) {
      await devolverStock(items);
      reservado = [];
      return res.status(500).json({ error });
    }
    const id_pedido_creado = pedido[0].id_pedido;
    for (let item of carrito) {
      const { error: errorDetalle } = await crearDetallePedido({ id_pedido: id_pedido_creado, id_producto: item.id_producto, cantidad: item.cantidad, precio: item.producto.precio, total_parcial: Number(item.producto.precio) * Number(item.cantidad) });
      if (errorDetalle) {
        await eliminarPedido(id_pedido_creado);
        await devolverStock(items);
        reservado = [];
        return res.status(500).json({ error: errorDetalle.message });
      }
    }
    reservado = [];
    await vaciarCarritoPorUsuario(id_usuario);
    try {
      const { data: usuario } = await obtenerUsuarioPorId(id_usuario);
      if (usuario) await enviarConfirmacionPedido(usuario.email, usuario.nombre, id_pedido_creado, total);
    } catch (e) { console.log("Error correo:", e.message) }
    return res.status(201).json({ message: 'Pedido creado desde carrito', pedido: pedido[0], total });
  } catch (error) {
    if (reservado.length) await devolverStock(reservado);
    return res.status(500).json({ error: error.message });
  }
};

export const obtenerPedidoUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await obtenerPedidoConDetalles(id);
    if (error ||!data) return res.status(404).json({ error: 'Pedido no encontrado' });
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