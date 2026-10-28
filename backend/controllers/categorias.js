// import { crearCategoria, obtenerCategorias, obtenerCategoriaPorId, actualizarCategoria, eliminarCategoria } from '../models/categorias.js';

// // Crear categoria
// export const crear = async (req, res) => {
//     try {
//         console.log("📥 Datos recibidos en CREAR CATEGORIA:", req.body);
//         const { nombre, descripcion, imagen } = req.body;

//         if (!nombre) {
//             return res.status(400).json({
//                 error: 'El nombre de la categoria es requerido'
//             });
//         }

//         const { data, error } = await crearCategoria(nombre, descripcion, imagen);
//        if (error) {
//   console.log(error); // <--- AGREGA ESTO
//   return res.status(500).json({
//     error: 'Error al crear la categoria',
//     detalle: error.message // <--- Y ESTO
//   });
// }

//         return res.status(201).json({
//             message: 'Categoria creada exitosamente',
//             categoria: data[0]
//         });
//     } catch (error) {
//         console.error('Error en crear categoria:', error);
//         res.status(500).json({
//             error: 'Error en el servidor',
//             detalle: error.message
//         });
//     }
// };

// // Listar categorias
// export const listar = async (req, res) => {
//     try {
//         const { data, error } = await obtenerCategorias();
//         if (error) {
//             return res.status(500).json({
//                 error: 'Error al obtener las categorias'
//             });
//         }
//         return res.status(200).json({ categorias: data });
//     } catch (error) {
//         console.error('Error en listar categorias:', error);
//         res.status(500).json({
//             error: 'Error en el servidor',
//             detalle: error.message
//         });
//     }
// };

// // Obtener una categoria
// export const obtener = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const { data, error } = await obtenerCategoriaPorId(id);
//         if (error) {
//             return res.status(404).json({
//                 error: 'Categoria no encontrada'
//             });
//         }
//         return res.status(200).json({ categoria: data });
//     } catch (error) {
//         console.error('Error en obtener categoria:', error);
//         res.status(500).json({
//             error: 'Error en el servidor',
//             detalle: error.message
//         });
//     }
// };

// // Actualizar categoria
// export const actualizar = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const campos = req.body;

//         const { data, error } = await actualizarCategoria(id, campos);
//         if (error) {
//             return res.status(500).json({
//                 error: 'Error al actualizar la categoria'
//             });
//         }
//         return res.status(200).json({
//             message: 'Categoria actualizada exitosamente',
//             categoria: data[0]
//         });
//     } catch (error) {
//         console.error('Error en actualizar categoria:', error);
//         res.status(500).json({
//             error: 'Error en el servidor',
//             detalle: error.message
//         });
//     }
// };

// // Eliminar categoria
// export const eliminar = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const { error } = await eliminarCategoria(id);
//         if (error) {
//             return res.status(500).json({
//                 error: 'Error al eliminar la categoria'
//             });
//         }
//         return res.status(200).json({
//             message: 'Categoria eliminada exitosamente'
//         });
//     } catch (error) {
//         console.error('Error en eliminar categoria:', error);
//         res.status(500).json({
//             error: 'Error en el servidor',
//             detalle: error.message
//         });
//     }
// };
import { crearCategoria, obtenerCategorias, obtenerCategoriaPorId, actualizarCategoria, eliminarCategoria } from '../models/categorias.js';
import { subirFoto } from '../utils/subirFoto.js';

const CARPETA_CATEGORIAS = 'papeleria/categorias';

// Crear categoria (llega como multipart: campos de texto + archivo "imagen")
export const crear = async (req, res) => {
    try {
        const body = req.body || {};
        console.log('📥 CREAR CATEGORIA -> body:', body, '| archivo:', !!req.file);

        const nombre = (body.nombre || '').trim();
        const descripcion = body.descripcion || '';

        if (!nombre) {
            return res.status(400).json({
                error: 'El nombre de la categoria es requerido'
            });
        }

        // Si llegó un archivo se sube a Cloudinary; si no, se acepta una URL en el body
        let imagen = body.imagen || null;
        if (req.file) {
            imagen = await subirFoto(req.file.buffer, CARPETA_CATEGORIAS);
        }

        const { data, error } = await crearCategoria(nombre, descripcion, imagen);
        if (error) {
            console.log(error);
            return res.status(500).json({
                error: 'Error al crear la categoria',
                detalle: error.message
            });
        }

        return res.status(201).json({
            message: 'Categoria creada exitosamente',
            categoria: data[0]
        });
    } catch (error) {
        console.error('Error en crear categoria:', error);
        res.status(500).json({
            error: 'Error en el servidor',
            detalle: error.message
        });
    }
};

// Listar categorias
export const listar = async (req, res) => {
    try {
        const { data, error } = await obtenerCategorias();
        if (error) {
            return res.status(500).json({
                error: 'Error al obtener las categorias'
            });
        }
        return res.status(200).json({ categorias: data });
    } catch (error) {
        console.error('Error en listar categorias:', error);
        res.status(500).json({
            error: 'Error en el servidor',
            detalle: error.message
        });
    }
};

// Obtener una categoria
export const obtener = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await obtenerCategoriaPorId(id);
        if (error) {
            return res.status(404).json({
                error: 'Categoria no encontrada'
            });
        }
        return res.status(200).json({ categoria: data });
    } catch (error) {
        console.error('Error en obtener categoria:', error);
        res.status(500).json({
            error: 'Error en el servidor',
            detalle: error.message
        });
    }
};

// Actualizar categoria (multipart: la imagen es opcional)
export const actualizar = async (req, res) => {
    try {
        const { id } = req.params;
        const body = req.body || {};

        // Solo se actualizan los campos que realmente llegaron
        const campos = {};
        if (body.nombre !== undefined) campos.nombre = body.nombre;
        if (body.descripcion !== undefined) campos.descripcion = body.descripcion;

        // Si se eligió una imagen nueva, se sube y se reemplaza la URL
        if (req.file) {
            campos.imagen = await subirFoto(req.file.buffer, CARPETA_CATEGORIAS);
        } else if (body.imagen) {
            campos.imagen = body.imagen;
        }

        if (Object.keys(campos).length === 0) {
            return res.status(400).json({
                error: 'No se enviaron campos para actualizar'
            });
        }

        const { data, error } = await actualizarCategoria(id, campos);
        if (error) {
            console.log(error);
            return res.status(500).json({
                error: 'Error al actualizar la categoria',
                detalle: error.message
            });
        }
        return res.status(200).json({
            message: 'Categoria actualizada exitosamente',
            categoria: data[0]
        });
    } catch (error) {
        console.error('Error en actualizar categoria:', error);
        res.status(500).json({
            error: 'Error en el servidor',
            detalle: error.message
        });
    }
};

// Eliminar categoria
export const eliminar = async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await eliminarCategoria(id);
        if (error) {
            return res.status(500).json({
                error: 'Error al eliminar la categoria'
            });
        }
        return res.status(200).json({
            message: 'Categoria eliminada exitosamente'
        });
    } catch (error) {
        console.error('Error en eliminar categoria:', error);
        res.status(500).json({
            error: 'Error en el servidor',
            detalle: error.message
        });
    }
};