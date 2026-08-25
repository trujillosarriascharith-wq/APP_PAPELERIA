import {supabase} from "../config/supabase.js";

// Crear un producto
export const crearProducto = async (id_categoria, nombre, descripcion, precio, cantidad_stock, imagen, estado) => {
    const {data, error} = await supabase
    .from('productos')
    .insert({id_categoria, nombre, descripcion, precio, cantidad_stock, imagen, estado: estado || 'activo'})
    .select('id_producto, id_categoria, nombre, descripcion, precio, cantidad_stock, imagen, estado');
    return {data, error};
};

// Obtener todos los productos (con el nombre de su categoria)
export const obtenerProductos = async () => {
    const {data, error} = await supabase
    .from('productos')
    .select('id_producto, id_categoria, nombre, descripcion, precio, cantidad_stock, imagen, estado, categorias(nombre)');
    return {data, error};
};

// Obtener productos filtrando por categoria
export const obtenerProductosPorCategoria = async (id_categoria) => {
    const {data, error} = await supabase
    .from('productos')
    .select('id_producto, id_categoria, nombre, descripcion, precio, cantidad_stock, imagen, estado')
    .eq('id_categoria', id_categoria);
    return {data, error};
};

// Obtener un producto por id
export const obtenerProductoPorId = async (id) => {
    const {data, error} = await supabase
    .from('productos')
    .select('id_producto, id_categoria, nombre, descripcion, precio, cantidad_stock, imagen, estado')
    .eq('id_producto', id)
    .single();
    return {data, error};
};

// Actualizar un producto
export const actualizarProducto = async (id, campos) => {
    const {data, error} = await supabase
    .from('productos')
    .update(campos)
    .eq('id_producto', id)
    .select('id_producto, id_categoria, nombre, descripcion, precio, cantidad_stock, imagen, estado');
    return {data, error};
};

// Descontar stock de un producto (usado al confirmar un pedido)
export const descontarStockProducto = async (id_producto, cantidad) => {
    const { data: producto, error: errorBusqueda } = await obtenerProductoPorId(id_producto);
    if (errorBusqueda) return { data: null, error: errorBusqueda };

    const nuevoStock = producto.cantidad_stock - cantidad;
    if (nuevoStock < 0) {
        return { data: null, error: { message: `Stock insuficiente para el producto ${id_producto}` } };
    }

    const {data, error} = await supabase
    .from('productos')
    .update({ cantidad_stock: nuevoStock })
    .eq('id_producto', id_producto)
    .select('id_producto, cantidad_stock');
    return {data, error};
};

// Eliminar un producto
export const eliminarProducto = async (id) => {
    const {data, error} = await supabase
    .from('productos')
    .delete()
    .eq('id_producto', id);
    return {data, error};
};
