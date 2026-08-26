import { crearPedido, obtenerPedidoConDetalles, obtenerPedidosPorUsuario, crearDetallePedido } from '../models/pedido.js';
import { obtenerCarritoPorUsuario, vaciarCarritoPorUsuario } from '../models/carrito.js';
import { obtenerUsuarioPorId } from '../models/user.js';
import { enviarConfirmacionPedido } from '../utils/sendEmail.js';

// Tu función actual (pedido manual)
export const crearPedidoConDetalles = async (req, res) => {
  try {
    const { id_usuario, direccion, telefono, detalles } = req.body;
    if (!id_usuario ||!detalles || detalles.length === 0) return res.status(400).json({ error: 'Datos incompletos' });
    let total = 0; detalles.forEach(d => { total += Number(d.subtotal || d.total_parcial); });
    const { data: pedido, error: errorPedido } = await crearPedido({ id_usuario, direccion, telefono, total, estado: 'pendiente', fecha: new Date() });
    if (errorPedido) return res.status(500).json({ error: errorPedido });
    const id_pedido_creado = pedido[0].id_pedido;
    for (let d of detalles) {
      await crearDetallePedido({ id_pedido: id_pedido_creado, id_producto: d.id_producto, cantidad: d.cantidad, precio: d.precio_unitario || d.precio, total_parcial: d.subtotal || d.total_parcial });
    }
    return res.status(201).json({ message: 'Pedido creado', pedido: pedido[0] });
  } catch (error) { return res.status(500).json({ error: error.message }); }
};

// NUEVA LÓGICA: CARRITO -> PEDIDO
export const crearPedidoDesdeCarrito = async (req, res) => {
  try {
    const { id_usuario, direccion, telefono } = req.body;
    if (!id_usuario) return res.status(400).json({ error: 'id_usuario requerido' });

    // 1. Traer carrito
    const { data: carrito, error: errorCarrito } = await obtenerCarritoPorUsuario(id_usuario);
    if (errorCarrito) return res.status(500).json({ error: 'Error al obtener carrito' });
    if (!carrito || carrito.length === 0) return res.status(400).json({ error: 'El carrito está vacío' });

    // 2. Calcular total
    let total = 0;
    carrito.forEach(item => {
      total += Number(item.producto.precio) * Number(item.cantidad);
    });

    // 3. Crear pedido
    const { data: pedido, error } = await crearPedido({ id_usuario, direccion, telefono, total, estado: 'pendiente', fecha: new Date() });
    if (error) return res.status(500).json({ error });
    const id_pedido_creado = pedido[0].id_pedido;

    // 4. Crear detalles desde el carrito
    for (let item of carrito) {
      await crearDetallePedido({
        id_pedido: id_pedido_creado,
        id_producto: item.id_producto,
        cantidad: item.cantidad,
        precio: item.producto.precio,
        total_parcial: Number(item.producto.precio) * Number(item.cantidad)
      });
    }

    // 5. Vaciar carrito
    await vaciarCarritoPorUsuario(id_usuario);

    // 6. Enviar correo
    const { data: usuario } = await obtenerUsuarioPorId(id_usuario);
    if (usuario) await enviarConfirmacionPedido(usuario.email, usuario.nombre, id_pedido_creado, total);

    return res.status(201).json({ message: 'Pedido creado desde carrito y carrito vaciado', pedido: pedido[0], total });

  } catch (error) { return res.status(500).json({ error: error.message }); }
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