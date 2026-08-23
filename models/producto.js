import { supabase } from '../config/supabase.js';

export const obtenerTodos = async () => {
    const {data, error} = await supabase.from ('productos').select ('*');
    return {data, error};
};

export const obtenerPorId = async (id_producto) => {
    const {data, error} = await supabase
    . from ('productos').select ('*').eq ('id_producto', id_producto).single();
    return {data, error};
};

export const obtenerPorCategoria = async (id_categoria) =>{
    const {data, error} = await supabase
    .from ('productos') .select ('*') .eq ('id_categoria', id_categoria);
    return {data, error}; 
};

export const crearProducto = async (productoData) => {
    const {data, error} = await supabase
    .from ('productos') .insert (productoData) .select();
    return {data, error};
};

export const actualizarProducto = async (id_producto, productoData) => {
    const {data, error} = await supabase
    .from ('productos') .update (productoData) .eq ('id_producto', id_producto) .select();
    return {data, error};
};

export  const eliminarProducto = async (id_producto) =>{
    const {data, error} = await supabase
    .from ('productos') .delete ().eq ('id_producto', id_producto) .select();
    return {data, error};
};