import {supabase} from "../config/supabase.js";

// Obtener el carrito activo de un usuario
export const obtenerCarritoPorUsuario = async (id_usuario) => {
    const {data, error} = await supabase
    .from('carrito')
    .select(`
      *,
      producto:id_producto(id_producto, nombre, precio, imagen_url)
    `)
    .eq('id_usuario', id_usuario)
    .maybeSingle(); // <-- CAMBIA single() por maybeSingle()
    return {data, error};
};

// Crear un carrito nuevo para un usuario
export const crearCarrito = async (id_usuario) => {
    const {data, error} = await supabase
    .from('carrito')
    .insert({ id_usuario })
    .select('id_carrito, id_usuario, fecha_creacion');
    return {data, error};
};

// Obtiene el carrito del usuario, o lo crea si no existe
export const obtenerOCrearCarrito = async (id_usuario) => {
    const { data: carritoExistente } = await obtenerCarritoPorUsuario(id_usuario);
    if (carritoExistente) {
        return { data: carritoExistente, error: null };
    }

    const { data, error } = await crearCarrito(id_usuario);
    if (error) return { data: null, error };
    return { data: data[0], error: null };
};

// Obtener el detalle (items) de un carrito, con datos del producto
export const obtenerDetalleCarrito = async (id_carrito) => {
    const {data, error} = await supabase
    .from('detalle_carrito')
    .select('id_detalle_carrito, id_carrito, id_producto, cantidad, productos(nombre, precio, imagen)')
    .eq('id_carrito', id_carrito);
    return {data, error};
};

// Buscar si un producto ya esta en el carrito
export const obtenerDetalleCarritoPorProducto = async (id_carrito, id_producto) => {
    const {data, error} = await supabase
    .from('detalle_carrito')
    .select('id_detalle_carrito, id_carrito, id_producto, cantidad')
    .eq('id_carrito', id_carrito)
    .eq('id_producto', id_producto)
    .single();
    return {data, error};
};

// Agregar un item nuevo al carrito
export const agregarDetalleCarrito = async (id_carrito, id_producto, cantidad) => {
    const {data, error} = await supabase
    .from('detalle_carrito')
    .insert({ id_carrito, id_producto, cantidad })
    .select('id_detalle_carrito, id_carrito, id_producto, cantidad');
    return {data, error};
};

// Actualizar la cantidad de un item del carrito
export const actualizarCantidadDetalle = async (id_detalle_carrito, cantidad) => {
    const {data, error} = await supabase
    .from('detalle_carrito')
    .update({ cantidad })
    .eq('id_detalle_carrito', id_detalle_carrito)
    .select('id_detalle_carrito, id_carrito, id_producto, cantidad');
    return {data, error};
};

// Eliminar un item del carrito
export const eliminarDetalleCarrito = async (id_detalle_carrito) => {
    const {data, error} = await supabase
    .from('detalle_carrito')
    .delete()
    .eq('id_detalle_carrito', id_detalle_carrito);
    return {data, error};
};

// Vaciar todo el carrito (se usa al finalizar la compra)
export const vaciarCarritoPorUsuario = async (id_usuario) => {
  const { data, error } = await supabase
   .from('carrito')
   .delete()
   .eq('id_usuario', id_usuario);
    return {data, error};
};

// alias para que no te falle si lo importas como "vaciar"
export const vaciar = vaciarCarritoPorUsuario;

export const obtenerCarrito = obtenerCarritoPorUsuario;