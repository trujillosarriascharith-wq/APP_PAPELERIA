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
    .select('id_producto, id_categoria, nombre, descripcion, precio, cantidad_stock, imagen, estado, categorias(nombre)')
    .or('estado.is.null,estado.neq.inactivo');
    return {data, error};
};

// Obtener productos filtrando por categoria
export const obtenerProductosPorCategoria = async (id_categoria) => {
    const {data, error} = await supabase
    .from('productos')
    .select('id_producto, id_categoria, nombre, descripcion, precio, cantidad_stock, imagen, estado')
    .eq('id_categoria', id_categoria)
    .or('estado.is.null,estado.neq.inactivo');
    return {data, error};
};

// Obtener un producto por id (sin filtrar: los pedidos viejos aún pueden leerlo)
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

// Descontar stock de un producto (versión anterior, ya no se usa en pedidos)
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

// Descuenta stock de forma atómica (función SQL descontar_stock).
// Devuelve { stock, error }. stock es null si no alcanzaba o el producto no existe.
export const descontarStockAtomico = async (id_producto, cantidad) => {
    const { data, error } = await supabase.rpc('descontar_stock', {
        p_id_producto: Number(id_producto),
        p_cantidad: Number(cantidad)
    });
    return { stock: data, error };
};

// Devuelve stock (usado para deshacer una reserva si el pedido falla)
export const reponerStockAtomico = async (id_producto, cantidad) => {
    const { data, error } = await supabase.rpc('reponer_stock', {
        p_id_producto: Number(id_producto),
        p_cantidad: Number(cantidad)
    });
    return { stock: data, error };
};

// Eliminar un producto (devuelve las filas borradas para poder verificarlo)
export const eliminarProducto = async (id) => {
    const {data, error} = await supabase
    .from('productos')
    .delete()
    .eq('id_producto', id)
    .select('id_producto');
    return {data, error};
};