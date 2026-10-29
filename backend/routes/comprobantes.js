import { Router } from 'express';
import { subir, consultar, vigente, listar, validar } from '../controllers/comprobantes.js';
import { verificarToken, verificarAdmin } from '../middlewares/authMiddlewares.js';
import { subirImagen } from '../middlewares/subirImagen.js';

const router = Router();

// 'comprobante' es el nombre del campo que envía Flutter
router.post('/', verificarToken, subirImagen.single('comprobante'), subir);
router.get('/', verificarToken, verificarAdmin, listar);
router.get('/mio/vigente', verificarToken, vigente); // antes que '/:id'
router.get('/:id', verificarToken, consultar);
router.put('/:id/validar', verificarToken, verificarAdmin, validar);

export default router;