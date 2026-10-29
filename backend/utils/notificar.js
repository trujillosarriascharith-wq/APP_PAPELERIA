import { supabase } from '../config/supabase.js';
import { crearNotificacion } from '../models/notificaciones.js';

// Crea una notificación sin que un fallo afecte la operación principal.
// extra: { imagen, id_comprobante } (opcional)
export const notificar = async (id_usuario, mensaje, extra = {}) => {
    try {
        const { error } = await crearNotificacion(id_usuario, mensaje, extra);
        if (error) console.log('Error al crear notificación:', error.message);
    } catch (e) {
        console.log('Error al crear notificación:', e.message);
    }
};

// Envía la misma notificación a todos los administradores
export const notificarAdmins = async (mensaje, extra = {}) => {
    try {
        const { data: admins, error } = await supabase
            .from('usuarios')
            .select('id_usuario')
            .eq('rol', 'admin');
        if (error) {
            console.log('No se pudo buscar a los administradores:', error.message);
            return;
        }
        await Promise.all((admins || []).map((a) => notificar(a.id_usuario, mensaje, extra)));
    } catch (e) {
        console.log('Error al notificar a los administradores:', e.message);
    }
};