// import {
//     crearProducto,
//     obtenerProductos,
//     obtenerProductosPorCategoria,
//     obtenerProductoPorId,
//     actualizarProducto,
//     eliminarProducto
// } from '../models/producto.js';

// // Crear producto
// export const crear = async (req, res) => {
//     try {
//         console.log("📥 Datos recibidos en CREAR PRODUCTO:", req.body);
//         const { id_categoria, nombre, descripcion, precio, cantidad_stock, imagen, estado } = req.body;

//         if (!nombre || !precio) {
//             return res.status(400).json({
//                 error: 'El nombre y el precio del producto son requeridos'
//             });
//         }

//         const { data, error } = await crearProducto(id_categoria, nombre, descripcion, precio, cantidad_stock, imagen, estado);
//         if (error) {
//            console.log(error); // para verlo en tu terminal
// return res.status(500).json({ 
//   error: 'Error al crear el producto',
//   detalle: error.message 
// });
//         }

//         return res.status(201).json({
//             message: 'Producto creado exitosamente',
//             producto: data[0]
//         });
//     } catch (error) {
//         console.error('Error en crear producto:', error);
//         res.status(500).json({
//             error: 'Error en el servidor',
//             detalle: error.message
//         });
//     }
// };

// // Listar productos (opcionalmente filtrando por categoria con ?id_categoria=)
// export const listar = async (req, res) => {
//     try {
//         const { id_categoria } = req.query;

//         const { data, error } = id_categoria
//             ? await obtenerProductosPorCategoria(id_categoria)
//             : await obtenerProductos();

//         if (error) {
//             return res.status(500).json({
//                 error: 'Error al obtener los productos'
//             });
//         }
//         return res.status(200).json({ productos: data });
//     } catch (error) {
//         console.error('Error en listar productos:', error);
//         res.status(500).json({
//             error: 'Error en el servidor',
//             detalle: error.message
//         });
//     }
// };

// // Obtener un producto
// export const obtener = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const { data, error } = await obtenerProductoPorId(id);
//         if (error) {
//             return res.status(404).json({
//                 error: 'Producto no encontrado'
//             });
//         }
//         return res.status(200).json({ producto: data });
//     } catch (error) {
//         console.error('Error en obtener producto:', error);
//         res.status(500).json({
//             error: 'Error en el servidor',
//             detalle: error.message
//         });
//     }
// };

// // Actualizar producto
// export const actualizar = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const campos = req.body;

//         const { data, error } = await actualizarProducto(id, campos);
//         if (error) {
//             return res.status(500).json({
//                 error: 'Error al actualizar el producto'
//             });
//         }
//         return res.status(200).json({
//             message: 'Producto actualizado exitosamente',
//             producto: data[0]
//         });
//     } catch (error) {
//         console.error('Error en actualizar producto:', error);
//         res.status(500).json({
//             error: 'Error en el servidor',
//             detalle: error.message
//         });
//     }
// };

// // Eliminar producto
// export const eliminar = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const { error } = await eliminarProducto(id);
//         if (error) {
//             return res.status(500).json({
//                 error: 'Error al eliminar el producto'
//             });
//         }
//         return res.status(200).json({
//             message: 'Producto eliminado exitosamente'
//         });
//     } catch (error) {
//         console.error('Error en eliminar producto:', error);
//         res.status(500).json({
//             error: 'Error en el servidor',
//             detalle: error.message
//         });
//     }
// };
import {
    crearProducto,
    obtenerProductos,
    obtenerProductosPorCategoria,
    obtenerProductoPorId,
    actualizarProducto,
    eliminarProducto
} from '../models/producto.js';
import { subirFoto } from '../utils/subirFoto.js';

const CARPETA_PRODUCTOS = 'papeleria/productos';

// Crear producto (llega como multipart: campos de texto + archivo "imagen")
export const crear = async (req, res) => {
    try {
        const body = req.body || {};
        console.log('📥 CREAR PRODUCTO -> body:', body, '| archivo:', !!req.file);

        const { nombre, descripcion, estado } = body;
        const precio = Number(body.precio);
        const cantidad_stock = Number(body.cantidad_stock);
        const id_categoria = Number(body.id_categoria);

        if (!nombre || !precio) {
            return res.status(400).json({
                error: 'El nombre y el precio del producto son requeridos'
            });
        }
        if (!id_categoria) {
            return res.status(400).json({
                error: 'La categoría del producto es requerida'
            });
        }

        // Si llegó un archivo se sube a Cloudinary; si no, se acepta una URL en el body
        let imagen = body.imagen || null;
        if (req.file) {
            imagen = await subirFoto(req.file.buffer, CARPETA_PRODUCTOS);
        }

        const { data, error } = await crearProducto(
            id_categoria,
            nombre,
            descripcion,
            precio,
            Number.isNaN(cantidad_stock) ? 0 : cantidad_stock,
            imagen,
            estado || 'activo'
        );

        if (error) {
            console.log(error);
            return res.status(500).json({
                error: 'Error al crear el producto',
                detalle: error.message
            });
        }

        return res.status(201).json({
            message: 'Producto creado exitosamente',
            producto: data[0]
        });
    } catch (error) {
        console.error('Error en crear producto:', error);
        res.status(500).json({
            error: 'Error en el servidor',
            detalle: error.message
        });
    }
};

// Listar productos (opcionalmente filtrando por categoria con ?id_categoria=)
export const listar = async (req, res) => {
    try {
        const { id_categoria } = req.query;

        const { data, error } = id_categoria
            ? await obtenerProductosPorCategoria(id_categoria)
            : await obtenerProductos();

        if (error) {
            return res.status(500).json({
                error: 'Error al obtener los productos'
            });
        }
        return res.status(200).json({ productos: data });
    } catch (error) {
        console.error('Error en listar productos:', error);
        res.status(500).json({
            error: 'Error en el servidor',
            detalle: error.message
        });
    }
};

// Obtener un producto
export const obtener = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await obtenerProductoPorId(id);
        if (error) {
            return res.status(404).json({
                error: 'Producto no encontrado'
            });
        }
        return res.status(200).json({ producto: data });
    } catch (error) {
        console.error('Error en obtener producto:', error);
        res.status(500).json({
            error: 'Error en el servidor',
            detalle: error.message
        });
    }
};

// Actualizar producto (multipart: la imagen es opcional)
export const actualizar = async (req, res) => {
    try {
        const { id } = req.params;
        const body = req.body || {};

        // Solo se actualizan los campos que realmente llegaron
        const campos = {};
        if (body.nombre !== undefined) campos.nombre = body.nombre;
        if (body.descripcion !== undefined) campos.descripcion = body.descripcion;
        if (body.estado !== undefined) campos.estado = body.estado;
        if (body.precio !== undefined) campos.precio = Number(body.precio);
        if (body.cantidad_stock !== undefined) campos.cantidad_stock = Number(body.cantidad_stock);
        if (body.id_categoria !== undefined) campos.id_categoria = Number(body.id_categoria);

        // Si el administrador eligió una imagen nueva, se sube y se reemplaza la URL
        if (req.file) {
            campos.imagen = await subirFoto(req.file.buffer, CARPETA_PRODUCTOS);
        } else if (body.imagen) {
            campos.imagen = body.imagen;
        }

        const { data, error } = await actualizarProducto(id, campos);
        if (error) {
            console.log(error);
            return res.status(500).json({
                error: 'Error al actualizar el producto',
                detalle: error.message
            });
        }
        return res.status(200).json({
            message: 'Producto actualizado exitosamente',
            producto: data[0]
        });
    } catch (error) {
        console.error('Error en actualizar producto:', error);
        res.status(500).json({
            error: 'Error en el servidor',
            detalle: error.message
        });
    }
};

// Eliminar producto
export const eliminar = async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await eliminarProducto(id);
        if (error) {
            return res.status(500).json({
                error: 'Error al eliminar el producto'
            });
        }
        return res.status(200).json({
            message: 'Producto eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error en eliminar producto:', error);
        res.status(500).json({
            error: 'Error en el servidor',
            detalle: error.message
        });
    }
};