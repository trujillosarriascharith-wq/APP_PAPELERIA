import { supabase } from '../config/supabase.js';
import { crearNotificacion } from '../models/notificaciones.js';

const dinero = (n) => '$' + Number(n).toLocaleString('es-CO');

// Fecha en hora de Colombia: 23/10/2026, 04:35 p. m.
const fechaColombia = (f) =>
  new Date(f).toLocaleString('es-CO', {
    timeZone: 'America/Bogota',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

const guardar = async (id_usuario, mensaje) => {
  const { error } = await crearNotificacion(id_usuario, mensaje);
  if (error) console.log('Error al guardar notificación:', error.message);
};

/**
 * Crea la notificación del cliente y una por cada administrador.
 * Si algo falla aquí, el pedido NO se cancela (solo se imprime el error).
 */
export const notificarPedido = async ({
  pedido, fecha, nombre, direccion, telefono, metodo_pago, detalles, total,
}) => {
  try {
    const productos = detalles
      .map((d) => `• ${d.cantidad} x ${d.nombre || 'Producto ' + d.id_producto}`)
      .join('\n');

    const info = [
      `Pedido #${pedido.id_pedido}`,
      `Fecha: ${fechaColombia(fecha)}`,
      `Nombre: ${nombre}`,
      `Dirección: ${direccion || '-'}`,
      `Teléfono: ${telefono || '-'}`,
      `Método de pago: ${metodo_pago || 'No indicado'}`,
      `Productos:\n${productos}`,
    ].join('\n');

    // 1) Cliente
    await guardar(
      pedido.id_usuario,
      `¡Tu pedido fue realizado con éxito!\n\n${info}\nTotal pagado: ${dinero(total)}`
    );

    // 2) Administradores (rol que empieza por "admin")
    const { data: admins, error } = await supabase
      .from('usuarios')
      .select('id_usuario')
      .ilike('rol', 'admin%');
    if (error) throw error;

    for (const admin of admins || []) {
      await guardar(
        admin.id_usuario,
        `Se realizó un pedido\n\n${info}\nTotal: ${dinero(total)}`
      );
    }
  } catch (e) {
    console.log('Error al notificar el pedido:', e.message);
  }
};