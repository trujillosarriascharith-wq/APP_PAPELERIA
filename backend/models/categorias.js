import {supabase} from "../config/supabase.js";

// Crear una categoria
export const crearCategoria = async (nombre, descripcion, imagen) => {
    const {data, error} = await supabase
    .from('categorias')
    .insert({nombre, descripcion, imagen})
    .select('id_categoria, nombre, descripcion, imagen');
    return {data, error};
};

// Obtener todas las categorias
export const obtenerCategorias = async () => {
    const {data, error} = await supabase
    .from('categorias')
    .select('id_categoria, nombre, descripcion, imagen');
    return {data, error};
};

// Obtener una categoria por id
export const obtenerCategoriaPorId = async (id) => {
    const {data, error} = await supabase
    .from('categorias')
    .select('id_categoria, nombre, descripcion, imagen')
    .eq('id_categoria', id)
    .single();
    return {data, error};
};

// Actualizar una categoria
export const actualizarCategoria = async (id, campos) => {
    const {data, error} = await supabase
    .from('categorias')
    .update(campos)
    .eq('id_categoria', id)
    .select('id_categoria, nombre, descripcion, imagen');
    return {data, error};
};

// Eliminar una categoria
export const eliminarCategoria = async (id) => {
    const {data, error} = await supabase
    .from('categorias')
    .delete()
    .eq('id_categoria', id);
    return {data, error};
};