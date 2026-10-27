import express from 'express';
import { crear, listar, obtener, actualizar, eliminar } from '../controllers/categorias.js';
import { verificarToken } from '../middlewares/authMiddlewares.js';

const router = express.Router();

router.get('/', listar);
router.get('/:id', obtener);
router.post('/', verificarToken, crear);
router.put('/:id', verificarToken, actualizar);
router.delete('/:id', verificarToken, eliminar);

export default router;