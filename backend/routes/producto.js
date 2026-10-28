// import express from 'express';
// import { crear, listar, obtener, actualizar, eliminar } from '../controllers/producto.js';
// import { verificarToken } from '../middlewares/authMiddlewares.js';

// const router = express.Router();

// router.get('/', listar);
// router.get('/:id', obtener);
// router.post('/', verificarToken, crear);
// router.put('/:id', verificarToken, actualizar);
// router.delete('/:id', verificarToken, eliminar);

// export default router;
import express from 'express';
import { crear, listar, obtener, actualizar, eliminar } from '../controllers/producto.js';
import { verificarToken } from '../middlewares/authMiddlewares.js';
import { subirImagen } from '../middlewares/subirImagen.js';

const router = express.Router();

router.get('/', listar);
router.get('/:id', obtener);

// 'imagen' es el nombre del campo que envía Flutter en MultipartFile.fromBytes('imagen', ...)
router.post('/', verificarToken, subirImagen.single('imagen'), crear);
router.put('/:id', verificarToken, subirImagen.single('imagen'), actualizar);
router.delete('/:id', verificarToken, eliminar);

export default router;