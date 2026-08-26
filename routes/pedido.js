import express from 'express';
import { crearPedidoConDetalles, obtenerPedidoUsuario, misPedidos ,crearPedidoDesdeCarrito} from '../controllers/pedido.js';
import { verificarToken } from '../middlewares/authMiddlewares.js'; // tu middleware de auth
const router = express.Router();

router.post('/', crearPedidoConDetalles); // pedido manual
router.post('/desde-carrito', crearPedidoDesdeCarrito); // NUEVA RUTA CARRITO -> PEDIDO
router.get('/mis-pedidos', misPedidos);
router.get('/:id', obtenerPedidoUsuario);

export default router;
