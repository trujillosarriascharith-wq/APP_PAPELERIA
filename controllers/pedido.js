import { crearPedido,obtenerPedidoConDetalles,obtenerPedidosPorUsuario, actualizarEstadoPedido,crearDetallePedido} from '../models/pedido.js';
import { enviarConfirmacionPedido } from '../utils/sendEmail.js';
import { obtenerUsuarioPorId as obtenerUsuario, obtenerPorEmail } from '../models/user.js';

export const crearPedidoConDetalles = async (req, res) => {
  try {
    const { usuario_id,  direccion, telefono, notas, detalles } = req.body;

    if (!usuario_id || !detalles || detalles.length === 0) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }

    // Calcular total
    let total = 0;
    detalles.forEach(d => {
      total += d.subtotal;
    });

// 1. Crear pedido
    const { data: pedido, error: errorPedido } = await crearPedido({
      usuario_id, fecha, direccion, telefono , total
    });

      if (errorPedido || !pedido) {
      return res.status(500).json({ error: 'Error al crear pedido' });
    }

      // 2. Crear detalles del pedido
    const detallesConPedido = detalles.map(d => ({
      ...d, id_pedido: id[0].pedido
    }));

    for (let detalle of detallesConPedido) {
      await crearDetallePedido(detalle);
    }

    // 3. Obtener info del usuario para el correo
    const { data: usuario } = await obtenerUsuario(id_usuario);

  // 4. ENVIAR CORREO DE CONFIRMACIÓN
    if (usuario && usuario.email) {
      await enviarConfirmacionPedido(
        usuario.email,
        usuario.nombre,
        id[0].pedido,
        total
      );
    }

    
    return res.status(201).json({
      message: 'Pedido creado y correo enviado',
      pedido: pedido[0]
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
export const obtenerPedidoUsuario = async (req, res) => {
  try {
    const { id_pedido } = req.params;
    const { data, error } = await obtenerPedidoConDetalles(id_pedido);
    if (error || !data) return res.status(404).json({ error: 'Pedido no encontrado' });
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const misPedidos = async (req, res) => {
  try {
    const { id_usuario} = req.query;
    if (!id_usuario) return res.status(400).json({ error: 'usuario_id requerido' });
    const { data, error } = await obtenerPedidosPorUsuario(id_usuario);
    if (error) return res.status(500).json({ error: 'Error al obtener pedidos' });
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};