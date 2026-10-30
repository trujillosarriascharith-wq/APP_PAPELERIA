
import { Router } from "express";
import {
  crearPedidoConDetalles,
  crearPedidoDesdeCarrito,
  obtenerPedidoUsuario,
  misPedidos,
} from "../controllers/pedido.js";
import { verificarToken } from "../middlewares/authMiddlewares.js";

const router = Router();

// Crear pedido manual con detalles (la app Flutter)
router.post("/", verificarToken, crearPedidoConDetalles);

// Crear pedido desde el carrito del usuario
router.post("/desde-carrito", verificarToken, crearPedidoDesdeCarrito);

// Ver mis pedidos
router.get("/mis-pedidos", verificarToken, misPedidos);

// Ver un pedido por id
router.get("/:id", verificarToken, obtenerPedidoUsuario);

export default router;
