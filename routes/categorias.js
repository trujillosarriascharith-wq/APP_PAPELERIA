import { Router } from "express";
import {
  getCategorias,
  getCategoriaPorId,
  createCategoria,
  updateCategoria,
  deleteCategoria
} from "../controllers/categorias.js";

const router = Router();

// Obtener todas -> GET http://localhost:3000/categorias
router.get("/", getCategorias);

// Obtener una por ID -> GET http://localhost:3000/categorias/1
router.get("/:id_categoria", getCategoriaPorId);

// Crear -> POST http://localhost:3000/categorias
router.post("/", createCategoria);

// Actualizar -> PUT http://localhost:3000/categorias/1
router.put("/:id_categoria", updateCategoria);

// Eliminar -> DELETE http://localhost:3000/categorias/1
router.delete("/:id_categoria", deleteCategoria);

export default router;
// Crear: POST http://localhost:3000/categorias
// {
//   "nombre": "Flores",
//   "descripcion": "Arreglos florales para toda ocasión",
//   "imagen": "https://ejemplo.com/flores.jpg"
// }