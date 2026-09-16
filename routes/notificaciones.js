import { Router } from 'express';
import {
    registrarNotificacion,
    listarNotificaciones,
    obtenerMisNotificaciones,
    obtenerNotificacion,
    marcarComoLeida,
    marcarTodasLeidas,
    borrarNotificacion,
    vaciarNotificaciones
} from '../controllers/notificaciones.js';
import { verificarToken, verificarAdmin } from '../middlewares/authMiddlewares.js';

const router = Router();

// Rutas específicas primero (para que no choquen con '/:id')
router.get('/mis-notificaciones', verificarToken, obtenerMisNotificaciones);
router.put('/leidas/todas', verificarToken, marcarTodasLeidas);

// CRUD general
router.post('/', verificarToken, verificarAdmin, registrarNotificacion);
router.get('/', verificarToken, verificarAdmin, listarNotificaciones);
router.get('/:id', verificarToken, obtenerNotificacion);
router.put('/:id/leida', verificarToken, marcarComoLeida);
router.delete('/:id', verificarToken, borrarNotificacion);
router.delete('/', verificarToken, vaciarNotificaciones);

export default router;