import { crearPedido, obtenerPedidoConDetalles, obtenerPedidosPorUsuario, crearDetallePedido, eliminarPedido } from '../models/pedido.js';
import { obtenerCarritoConProductosParaPedido, vaciarCarritoPorUsuario, quitarProductosDelCarrito } from '../models/carrito.js';
import { descontarStockAtomico, reponerStockAtomico, obtenerProductoPorId } from '../models/producto.js';
import { obtenerUsuarioPorId } from '../models/user.js';
import { enviarConfirmacionPedido } from '../utils/sendEmail.js';
import { notificarPedido } from '../utils/notificarPedido.js';

// Devuelve al inventario lo que ya se había descontado
const devolverStock = async (items) => {
  for (const it of items) {
    await reponerStockAtomico(it.id_producto, it.cantidad);
  }
};

// Descuenta el stock de todos los productos del pedido.
// Si alguno no alcanza, devuelve lo que ya había descontado y avisa cuál falló.
const reservarStock = async (items) => {
  const reservados = [];
  for (const it of items) {
    const { stock, error } = await descontarStockAtomico(it.id_producto, it.cantidad);

    if (error) {
      await devolverStock(reservados);
      return { ok: false, status: 500, mensaje: error.message };
    }

    if (stock === null || stock === undefined) {
      await devolverStock(reservados);
      const { data: p } = await obtenerProductoPorId(it.id_producto);
      let mensaje = 'Producto no encontrado';
      if (p) {
        mensaje = p.cantidad_stock > 0
          ? `No hay suficientes unidades de "${p.nombre}". Disponibles: ${p.cantidad_stock}`
          : `"${p.nombre}" está agotado`;
      }
      return { ok: false, status: 409, mensaje };
    }

    reservados.push(it);
  }
  return { ok: true };
};

export const crearPedidoConDetalles = async (req, res) => {
  let items = null;       // productos a los que ya se les descontó el stock
  let confirmado = false; // true cuando el pedido quedó completo
  try {
    // El id del usuario viene del token, no del body
    const id_usuario = req.usuario?.id_usuario ?? req.usuario?.id;
    const { nombre, direccion, telefono, metodo_pago, detalles } = req.body;

    if (!id_usuario) return res.status(401).json({ error: 'No se pudo identificar al usuario' });
    if (!detalles || detalles.length === 0) return res.status(400).json({ error: 'Datos incompletos' });

    const lista = detalles.map(d => ({
      id_producto: Number(d.id_producto),
      cantidad: Number(d.cantidad),
    }));
    if (lista.some(i => !i.id_producto || !Number.isInteger(i.cantidad) || i.cantidad <= 0)) {
      return res.status(400).json({ error: 'Producto o cantidad inválidos' });
    }

    let total = 0;
    detalles.forEach(d => { total += Number(d.subtotal || d.total_parcial); });

    // 1) Descontar el stock (si no alcanza, el pedido no se crea)
    const reserva = await reservarStock(lista);
    if (!reserva.ok) return res.status(reserva.status).json({ error: reserva.mensaje });
    items = lista;

    const deshacer = async () => { await devolverStock(items); items = null; };

    // 2) Crear el pedido y sus detalles
    const fecha = new Date();
    const { data: pedido, error: errorPedido } = await crearPedido({ id_usuario, direccion, telefono, total, estado: 'pendiente', fecha });
    if (errorPedido) {
      await deshacer();
      return res.status(500).json({ error: errorPedido.message });
    }

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
        await deshacer();
        return res.status(500).json({ error: errorDetalle.message });
      }
    }
    confirmado = true;

    // 3) Quitar del carrito (en la base de datos) lo que ya se compró
    try {
      await quitarProductosDelCarrito(id_usuario, lista.map(i => i.id_producto));
    } catch (e) { console.log('Error al limpiar el carrito:', e.message); }

    // 4) Notificación para el cliente y para el administrador
    await notificarPedido({
      pedido: pedido[0],
      fecha,
      nombre: nombre || req.usuario?.nombre || 'Cliente',
      direccion,
      telefono,
      metodo_pago,
      detalles,
      total
    });

    return res.status(201).json({ message: 'Pedido creado', pedido: pedido[0] });
  } catch (error) {
    if (items && !confirmado) await devolverStock(items);
    return res.status(500).json({ error: error.message });
  }
};

export const crearPedidoDesdeCarrito = async (req, res) => {
  let items = null;
  let confirmado = false;
  try {
    const { id_usuario, direccion, telefono } = req.body;
    if (!id_usuario) return res.status(400).json({ error: 'id_usuario requerido' });

    const { data: carrito, error: errorCarrito } = await obtenerCarritoConProductosParaPedido(id_usuario);
    if (errorCarrito) return res.status(500).json({ error: errorCarrito.message });
    if (!carrito || carrito.length === 0) return res.status(400).json({ error: 'El carrito está vacío' });

    let total = 0;
    carrito.forEach(item => { total += Number(item.producto.precio) * Number(item.cantidad); });

    // Descontar el stock antes de crear el pedido
    const lista = carrito.map(i => ({ id_producto: i.id_producto, cantidad: Number(i.cantidad) }));
    const reserva = await reservarStock(lista);
    if (!reserva.ok) return res.status(reserva.status).json({ error: reserva.mensaje });
    items = lista;

    const { data: pedido, error } = await crearPedido({ id_usuario, direccion, telefono, total, estado: 'pendiente', fecha: new Date() });
    if (error) {
      await devolverStock(items);
      items = null;
      return res.status(500).json({ error: error.message });
    }

    const id_pedido_creado = pedido[0].id_pedido;
    for (let item of carrito) {
      const { error: errorDetalle } = await crearDetallePedido({
        id_pedido: id_pedido_creado,
        id_producto: item.id_producto,
        cantidad: item.cantidad,
        precio: item.producto.precio,
        total_parcial: Number(item.producto.precio) * Number(item.cantidad)
      });
      if (errorDetalle) {
        await eliminarPedido(id_pedido_creado);
        await devolverStock(items);
        items = null;
        return res.status(500).json({ error: errorDetalle.message });
      }
    }
    confirmado = true;

    await vaciarCarritoPorUsuario(id_usuario);
    try {
      const { data: usuario } = await obtenerUsuarioPorId(id_usuario);
      if (usuario) await enviarConfirmacionPedido(usuario.email, usuario.nombre, id_pedido_creado, total);
    } catch (e) { console.log("Error correo:", e.message) }
    return res.status(201).json({ message: 'Pedido creado desde carrito', pedido: pedido[0], total });
  } catch (error) {
    if (items && !confirmado) await devolverStock(items);
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