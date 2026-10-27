import { crearCategoria, obtenerCategorias, obtenerCategoriaPorId, actualizarCategoria, eliminarCategoria } from '../models/categorias.js';

// Crear categoria
export const crear = async (req, res) => {
    try {
        console.log("📥 Datos recibidos en CREAR CATEGORIA:", req.body);
        const { nombre, descripcion, imagen } = req.body;

        if (!nombre) {
            return res.status(400).json({
                error: 'El nombre de la categoria es requerido'
            });
        }

        const { data, error } = await crearCategoria(nombre, descripcion, imagen);
       if (error) {
  console.log(error); // <--- AGREGA ESTO
  return res.status(500).json({
    error: 'Error al crear la categoria',
    detalle: error.message // <--- Y ESTO
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

// Actualizar categoria
export const actualizar = async (req, res) => {
    try {
        const { id } = req.params;
        const campos = req.body;

        const { data, error } = await actualizarCategoria(id, campos);
        if (error) {
            return res.status(500).json({
                error: 'Error al actualizar la categoria'
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