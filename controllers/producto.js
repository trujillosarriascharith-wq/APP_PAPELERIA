import {
    crearProducto,
    obtenerProductos,
    obtenerProductosPorCategoria,
    obtenerProductoPorId,
    actualizarProducto,
    eliminarProducto
} from '../models/producto.js';

// Crear producto
export const crear = async (req, res) => {
    try {
        console.log("📥 Datos recibidos en CREAR PRODUCTO:", req.body);
        const { id_categoria, nombre, descripcion, precio, cantidad_stock, imagen, estado } = req.body;

        if (!nombre || !precio) {
            return res.status(400).json({
                error: 'El nombre y el precio del producto son requeridos'
            });
        }

        const { data, error } = await crearProducto(id_categoria, nombre, descripcion, precio, cantidad_stock, imagen, estado);
        if (error) {
           console.log(error); // para verlo en tu terminal
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

// Actualizar producto
export const actualizar = async (req, res) => {
    try {
        const { id } = req.params;
        const campos = req.body;

        const { data, error } = await actualizarProducto(id, campos);
        if (error) {
            return res.status(500).json({
                error: 'Error al actualizar el producto'
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
