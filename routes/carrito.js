import express from 'express';
import { obtenerMiCarrito, agregarProducto, actualizarCantidad, eliminarProducto, vaciar } from '../controllers/carrito.js';
import { verificarToken } from '../middlewares/authMiddlewares.js';

const router = express.Router();

router.get('/', verificarToken, obtenerMiCarrito);
router.post('/', verificarToken, agregarProducto);
router.put('/:id_detalle', verificarToken, actualizarCantidad);
router.delete('/:id_detalle', verificarToken, eliminarProducto);
router.delete('/', verificarToken, vaciar);

export default router;