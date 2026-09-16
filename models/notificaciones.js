import { supabase } from "../config/supabase.js";

// Crear una notificación para un usuario
export const crearNotificacion = async (id_usuario, mensaje) => {
    const { data, error } = await supabase
        .from('notificaciones')
        .insert({ id_usuario, mensaje })
        .select('id_notificacion, id_usuario, mensaje, leida, fecha');
    return { data, error };
};

// Obtener todas las notificaciones (uso administrativo)
export const obtenerNotificaciones = async () => {
    const { data, error } = await supabase
        .from('notificaciones')
        .select('id_notificacion, id_usuario, mensaje, leida, fecha')
        .order('fecha', { ascending: false });
    return { data, error };
};

// Obtener las notificaciones de un usuario en específico
export const obtenerNotificacionesPorUsuario = async (id_usuario) => {
    const { data, error } = await supabase
        .from('notificaciones')
        .select('id_notificacion, id_usuario, mensaje, leida, fecha')
        .eq('id_usuario', id_usuario)
        .order('fecha', { ascending: false });
    return { data, error };
};

// Obtener una notificación por su id
export const obtenerNotificacionPorId = async (id_notificacion) => {
    const { data, error } = await supabase
        .from('notificaciones')
        .select('id_notificacion, id_usuario, mensaje, leida, fecha')
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
        .select('id_notificacion, id_usuario, mensaje, leida, fecha');
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