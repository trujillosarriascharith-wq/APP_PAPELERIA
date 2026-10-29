import { supabase } from "../config/supabase.js";

const COLUMNAS = 'id_notificacion, id_usuario, mensaje, leida, fecha, imagen, id_comprobante';
// Incluye el estado del comprobante para mostrar (o esconder) los botones
const COLUMNAS_CON_ESTADO = `${COLUMNAS}, comprobantes(estado)`;

// Crear una notificación para un usuario.
// extra: { imagen, id_comprobante } (opcional, para notificaciones de pago)
export const crearNotificacion = async (id_usuario, mensaje, extra = {}) => {
    const fila = { id_usuario, mensaje };
    if (extra.imagen) fila.imagen = extra.imagen;
    if (extra.id_comprobante) fila.id_comprobante = extra.id_comprobante;

    const { data, error } = await supabase
        .from('notificaciones')
        .insert(fila)
        .select(COLUMNAS);
    return { data, error };
};

// Obtener todas las notificaciones (uso administrativo)
export const obtenerNotificaciones = async () => {
    const { data, error } = await supabase
        .from('notificaciones')
        .select(COLUMNAS_CON_ESTADO)
        .order('fecha', { ascending: false });
    return { data, error };
};

// Obtener las notificaciones de un usuario en específico
export const obtenerNotificacionesPorUsuario = async (id_usuario) => {
    const { data, error } = await supabase
        .from('notificaciones')
        .select(COLUMNAS_CON_ESTADO)
        .eq('id_usuario', id_usuario)
        .order('fecha', { ascending: false });
    return { data, error };
};

// Obtener una notificación por su id
export const obtenerNotificacionPorId = async (id_notificacion) => {
    const { data, error } = await supabase
        .from('notificaciones')
        .select(COLUMNAS_CON_ESTADO)
        .eq('id_notificacion', id_notificacion)
        .single();
    return { data, error };
};

// Marcar una notificación puntual como leída
export const marcarNotificacionLeida = async (id_notificacion) => {
    const { data, error } = await supabase
        .from('notificaciones')
        .update({ leida: true })
        .eq('id_notificacion', id_notificacion)
        .select(COLUMNAS);
    return { data, error };
};

// Marcar todas las notificaciones no leídas de un usuario como leídas
export const marcarTodasComoLeidas = async (id_usuario) => {
    const { data, error } = await supabase
        .from('notificaciones')
        .update({ leida: true })
        .eq('id_usuario', id_usuario)
        .eq('leida', false)
        .select('id_notificacion');
    return { data, error };
};

// Eliminar una notificación puntual
export const eliminarNotificacion = async (id_notificacion) => {
    const { error } = await supabase
        .from('notificaciones')
        .delete()
        .eq('id_notificacion', id_notificacion);
    return { error };
};

// Vaciar (eliminar) todas las notificaciones de un usuario
export const vaciarNotificacionesUsuario = async (id_usuario) => {
    const { error } = await supabase
        .from('notificaciones')
        .delete()
        .eq('id_usuario', id_usuario);
    return { error };
};