import { crearNotificacion } from '../models/notificaciones.js';

// Crea una notificación sin que un fallo afecte la operación principal
export const notificar = async (id_usuario, mensaje) => {
    try {
        const { error } = await crearNotificacion(id_usuario, mensaje);
        if (error) console.log('Error al crear notificación:', error.message);
    } catch (e) {
        console.log('Error al crear notificación:', e.message);
    }
};