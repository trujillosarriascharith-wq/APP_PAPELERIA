// import { Router } from "express";
// import { crearPedidoConDetalles, crearPedidoDesdeCarrito, obtenerPedidoUsuario, misPedidos } from "../controllers/pedido.js";

// const router = Router();

// // Crear pedido manual con detalles
// router.post("/", crearPedidoConDetalles);

// // Crear pedido desde el carrito del usuario
// router.post("/desde-carrito", crearPedidoDesdeCarrito);

// // Ver mis pedidos?id_usuario=1
// router.get("/mis-pedidos", misPedidos);

// // Ver un pedido por id
// router.get("/:id", obtenerPedidoUsuario);

// export default router;
import { Router } from "express";
import { crearPedidoConDetalles, crearPedidoDesdeCarrito, obtenerPedidoUsuario, misPedidos } from "../controllers/pedido.js";
import { verificarToken } from "../middlewares/authMiddlewares.js";

const router = Router();

// Crear pedido manual con detalles (el id del usuario sale del token)
router.post("/", verificarToken, crearPedidoConDetalles);

// Crear pedido desde el carrito del usuario
router.post("/desde-carrito", crearPedidoDesdeCarrito);

// Ver mis pedidos?id_usuario=1
router.get("/mis-pedidos", misPedidos);

// Ver un pedido por id
router.get("/:id", obtenerPedidoUsuario);

export default router;
