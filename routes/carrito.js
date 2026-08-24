import { Router } from "express";
import {
  obtenerCarrito,
  agregarAlCarrito,
  actualizarCantidadCarrito,
  eliminarDelCarrito,
  vaciarCarrito
} from "../controllers/carrito.js";

const router = Router();

// Ver carrito de un usuario -> GET http://localhost:3000/carrito/1
router.get("/:id_usuario", obtenerCarrito);

// Agregar producto -> POST http://localhost:3000/carrito
router.post("/", agregarAlCarrito);

// Actualizar cantidad -> PUT http://localhost:3000/carrito/5
router.put("/:id_detalle_carrito", actualizarCantidadCarrito);

// Eliminar un producto -> DELETE http://localhost:3000/carrito/5
router.delete("/detalle/:id_detalle_carrito", eliminarDelCarrito);

// Vaciar carrito completo -> DELETE http://localhost:3000/carrito/vaciar/1
router.delete("/vaciar/:id_carrito", vaciarCarrito);

export default router;
// //Agregar: POST http://localhost:3000/carrito
// json    {
//       "id_usuario": 1,
//       "id_producto": 1,
//       "cantidad": 2
//     }
// Ver: GET http://localhost:3000/carrito/1