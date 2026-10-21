
import express from 'express';
import { crear, listar, obtener, actualizar, eliminar } from '../controllers/producto.js';
import { verificarToken, verificarAdmin } from '../middlewares/authMiddlewares.js';
import { subirImagen } from '../middlewares/subirImagen.js';

const router = express.Router();

router.get('/', listar);
router.get('/:id', obtener);
// Crear y actualizar reciben la foto en el campo "imagen" (multipart)
router.post('/', verificarToken, verificarAdmin, subirImagen.single('imagen'), crear);
router.put('/:id', verificarToken, verificarAdmin, subirImagen.single('imagen'), actualizar);
router.delete('/:id', verificarToken, verificarAdmin, eliminar);

export default router;