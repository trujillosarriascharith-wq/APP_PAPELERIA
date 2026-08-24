import { supabase } from "../config/supabase.js";

// Obtener todas las categorias
export const obtenerCategorias = async () => {
  const { data, error } = await supabase
   .from('categorias')
   .select('*')
   .order('id_categoria', { ascending: true });
  return { data, error };
};

// Obtener categoria por ID
export const obtenerCategoriaPorId = async (id_categoria) => {
  const { data, error } = await supabase
   .from('categorias')
   .select('*')
   .eq('id_categoria', id_categoria)
   .single();
  return { data, error };
};

// Crear categoria
export const crearCategoria = async (categoria) => {
  const { data, error } = await supabase
   .from('categorias')
   .insert([categoria])
   .select()
   .single();
  return { data, error };
};

// Actualizar categoria
export const actualizarCategoria = async (id_categoria, datos) => {
  const { data, error } = await supabase
   .from('categorias')
   .update(datos)
   .eq('id_categoria', id_categoria)
   .select()
   .single();
  return { data, error };
};

// Eliminar categoria
export const eliminarCategoria = async (id_categoria) => {
  const { error } = await supabase
   .from('categorias')
   .delete()
   .eq('id_categoria', id_categoria);
  return { error };
};