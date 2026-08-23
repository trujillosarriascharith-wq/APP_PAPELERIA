import express from 'express';
import { listarProductos, obtenerProducto, obtenerPorCat,crear,editar ,eliminar } from '../controllers/producto.js';
import { verificarToken , verificarAdmin } from '../middlewares/authMiddlewares.js';
import { upload } from '../config/cloudinary.js';
const router = express.Router();

//rutas publicas

// GET - Obtener todos
router.get('/productos', listarProductos);

// GET - Obtener por ID
router.get('/productos/:id_producto', obtenerProducto);

// GET - Obtener por categoría
router.get('/productos/id_categoria/:id_categoria', obtenerPorCat);


//rutas privadas (requieren token y rol de admnin)

// POST - Crear producto
router.post('/productos', verificarToken,verificarAdmin,upload.single('imagen'),crear);

// PUT - Actualizar producto
router.put('/productos/:id_producto', verificarToken,verificarAdmin,upload.single('imagen'),editar);

// DELETE - Eliminar producto
router.delete('/productos/:id_producto', verificarToken,verificarAdmin,eliminar);

export default router;