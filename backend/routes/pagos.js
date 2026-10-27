import { Router } from 'express';
import { registrarPago, listarPagos, obtenerPago, editarEstadoPago, borrarPago } from '../controllers/pagos.js';
import { verificarToken, verificarAdmin } from '../middlewares/authMiddlewares.js';

const router = Router();

router.post('/', verificarToken, registrarPago);
router.get('/', verificarToken, verificarAdmin, listarPagos);
router.get('/pedido/:id_pedido', verificarToken, obtenerPago);
router.put('/:id', verificarToken, verificarAdmin, editarEstadoPago);
router.delete('/:id', verificarToken, verificarAdmin, borrarPago);

export default router;