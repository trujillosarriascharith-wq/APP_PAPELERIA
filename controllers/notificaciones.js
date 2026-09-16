import {
    crearNotificacion,
    obtenerNotificaciones,
    obtenerNotificacionesPorUsuario,
    obtenerNotificacionPorId,
    marcarNotificacionLeida,
    marcarTodasComoLeidas,
    eliminarNotificacion,
    vaciarNotificacionesUsuario
} from '../models/notificaciones.js';

// Registrar una notificación para un usuario (uso administrativo / interno)
export const registrarNotificacion = async (req, res) => {
    try {
        console.log("📩 Datos recibidos en CREAR NOTIFICACION:", req.body);
        const { id_usuario, mensaje } = req.body;

        if (!id_usuario ||!mensaje) {
            return res.status(400).json({ error: 'id_usuario y mensaje son requeridos' });
        }

        const { data, error } = await crearNotificacion(id_usuario, mensaje);
        if (error) {
            console.error("ERROR SUPABASE REAL:", error);
            return res.status(500).json({
                error: 'Error al registrar la notificación',
                detalle_real: error.message,
                codigo: error.code,
                hint: error.hint
            });
        }

        return res.status(201).json({ message: 'Notificación registrada exitosamente', notificacion: data[0] });
    } catch (error) {
        console.error('Error en registrar notificación:', error);
        res.status(500).json({ error: 'Error en el servidor', detalle: error.message });
    }
};

// Listar todas las notificaciones (uso administrativo)
export const listarNotificaciones = async (req, res) => {
    try {
        const { data, error } = await obtenerNotificaciones();
        if (error) {
            console.log(error);
            return res.status(500).json({ error: 'Error al listar las notificaciones', detalle: error.message });
        }
        return res.status(200).json({ notificaciones: data });
    } catch (error) {
        console.error('Error en listar notificaciones:', error);
        res.status(500).json({ error: 'Error en el servidor', detalle: error.message });
    }
};

// Obtener las notificaciones del usuario autenticado
export const obtenerMisNotificaciones = async (req, res) => {
    try {
        const id_usuario = req.usuario?.id_usuario || req.id_usuario?.id_usuario;

        const { data, error } = await obtenerNotificacionesPorUsuario(id_usuario);
        if (error) {
            console.log(error);
            return res.status(500).json({ error: 'Error al obtener las notificaciones', detalle: error.message });
        }
        return res.status(200).json({ notificaciones: data });
    } catch (error) {
        console.error('Error en obtener mis notificaciones:', error);
        res.status(500).json({ error: 'Error en el servidor', detalle: error.message });
    }
};

// Obtener una notificación por id_notificacion
export const obtenerNotificacion = async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await obtenerNotificacionPorId(id);
        if (error) {
            return res.status(500).json({ error: 'Error al obtener la notificación', detalle: error.message });
        }
        if (!data) {
            return res.status(404).json({ error: 'Notificación no encontrada' });
        }
        return res.status(200).json({ notificacion: data });
    } catch (error) {
        console.error('Error en obtener notificación:', error);
        res.status(500).json({ error: 'Error en el servidor', detalle: error.message });
    }
};

// Marcar una notificación puntual como leída
export const marcarComoLeida = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await marcarNotificacionLeida(id);
        if (error) {
            return res.status(500).json({ error: 'Error al marcar la notificación como leída', detalle: error.message });
        }
        return res.status(200).json({ message: 'Notificación marcada como leída', notificacion: data[0] });
    } catch (error) {
        console.error('Error en marcar notificación como leída:', error);
        res.status(500).json({ error: 'Error en el servidor', detalle: error.message });
    }
};

// Marcar todas las notificaciones del usuario autenticado como leídas
export const marcarTodasLeidas = async (req, res) => {
    try {
        const id_usuario = req.usuario?.id_usuario || req.usuario?.id;

        const { data, error } = await marcarTodasComoLeidas(id_usuario);
        if (error) {
            return res.status(500).json({ error: 'Error al marcar las notificaciones como leídas', detalle: error.message });
        }
        return res.status(200).json({ message: 'Notificaciones marcadas como leídas', total: data.length });
    } catch (error) {
        console.error('Error en marcar todas como leídas:', error);
        res.status(500).json({ error: 'Error en el servidor', detalle: error.message });
    }
};

// Eliminar una notificación puntual
export const borrarNotificacion = async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await eliminarNotificacion(id);
        if (error) {
            return res.status(500).json({ error: 'Error al eliminar la notificación', detalle: error.message });
        }
        return res.status(200).json({ message: 'Notificación eliminada' });
    } catch (error) {
        console.error('Error en eliminar notificación:', error);
        res.status(500).json({ error: 'Error en el servidor', detalle: error.message });
    }
};

// Vaciar todas las notificaciones del usuario autenticado
export const vaciarNotificaciones = async (req, res) => {
    try {
        const id_usuario = req.usuario?.id_usuario || req.usuario?.id || req.id_usuario?.id_usuario;
        const { error } = await vaciarNotificacionesUsuario(id_usuario);
        if (error) throw error;

        return res.status(200).json({ message: "Notificaciones vaciadas" });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};