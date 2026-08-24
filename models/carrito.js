import { supabase } from "../config/supabase.js";

// ===== CARRITO =====

export const obtenerCarritoPorUsuario = async (id_usuario) => {
  const { data, error } = await supabase
    .from('carrito')
    .select('*')
    .eq('id_usuario', id_usuario)
    .order('fecha_creacion', { ascending: false })
    .limit(1)
    .single();
  return { data, error };
};

export const crearCarrito = async (id_usuario) => {
  const { data, error } = await supabase
    .from('carrito')
    .insert([{ id_usuario }])
    .select()
    .single();
  return { data, error };
};

export const eliminarCarrito = async (id_carrito) => {
  const { error } = await supabase.from('carrito').delete().eq('id_carrito', id_carrito);
  return { error };
};

// ===== DETALLE_CARRITO =====

export const obtenerDetalleCarrito = async (id_carrito) => {
  const { data, error } = await supabase
    .from('detalle_carrito')
    .select(`
      *,
      productos (
        id_producto,
        nombre,
        precio,
        imagen
      )
    `)
    .eq('id_carrito', id_carrito);
  return { data, error };
};

export const agregarProductoCarrito = async (id_carrito, id_producto, cantidad) => {
  // Verificar si el producto ya está en el carrito
  const { data: existente } = await supabase
    .from('detalle_carrito')
    .select('*')
    .eq('id_carrito', id_carrito)
    .eq('id_producto', id_producto)
    .single();

  if (existente) {
    // Si existe, suma la cantidad
    const { data, error } = await supabase
      .from('detalle_carrito')
      .update({ cantidad: existente.cantidad + cantidad })
      .eq('id_detalle_carrito', existente.id_detalle_carrito)
      .select()
      .single();
    return { data, error };
  } else {
    // Si no existe, lo inserta
    const { data, error } = await supabase
      .from('detalle_carrito')
      .insert([{ id_carrito, id_producto, cantidad }])
      .select()
      .single();
    return { data, error };
  }
};

export const actualizarCantidad = async (id_detalle_carrito, cantidad) => {
  const { data, error } = await supabase
    .from('detalle_carrito')
    .update({ cantidad })
    .eq('id_detalle_carrito', id_detalle_carrito)
    .select()
    .single();
  return { data, error };
};

export const eliminarProductoCarrito = async (id_detalle_carrito) => {
  const { error } = await supabase
    .from('detalle_carrito')
    .delete()
    .eq('id_detalle_carrito', id_detalle_carrito);
  return { error };
};

export const vaciarCarrito = async (id_carrito) => {
  const { error } = await supabase
    .from('detalle_carrito')
    .delete()
    .eq('id_carrito', id_carrito);
  return { error };
};