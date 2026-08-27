import { supabase } from "../config/supabase.js";

// Crear cabecera del pedido
export const crearPedido = async ({ id_usuario, direccion, telefono, total, estado, fecha }) => {
  const { data, error } = await supabase
    .from('pedido')
    .insert([{ id_usuario, direccion, telefono, total, estado, fecha }])
    .select('id_pedido, id_usuario, total, estado, fecha');
  return { data, error };
};

// Crear detalle del pedido
export const crearDetallePedido = async ({ id_pedido, id_producto, cantidad, precio, total_parcial }) => {
  const { data, error } = await supabase
    .from('detalle_pedido')
    .insert([{ id_pedido, id_producto, cantidad, precio, total_parcial }])
    .select();
  return { data, error };
};

// Obtener un pedido con sus productos
export const obtenerPedidoConDetalles = async (id_pedido) => {
  const { data: pedido, error: errorPedido } = await supabase
    .from('pedido')
    .select('*')
    .eq('id_pedido', id_pedido)
    .maybeSingle();

  if (errorPedido) return { data: null, error: errorPedido };
  if (!pedido) return { data: null, error: null };

  const { data: detalles, error: errorDet } = await supabase
    .from('detalle_pedido')
    .select('*, productos(nombre, precio)')
    .eq('id_pedido', id_pedido);

  if (errorDet) return { data: null, error: errorDet };

  return { data: { ...pedido, detalles }, error: null };
};

// Obtener todos los pedidos de un usuario
export const obtenerPedidosPorUsuario = async (id_usuario) => {
  const { data, error } = await supabase
    .from('pedido')
    .select('*')
    .eq('id_usuario', id_usuario)
    .order('id_pedido', { ascending: false });
  return { data, error };
};

// --- ESTOS 3 SON LOS QUE TE FALTABAN Y POR ESO CRASHEABA ---

export const obtenerTodosLosPedidos = async () => {
  const { data, error } = await supabase
   .from('pedido')
   .select('*')
   .order('id_pedido', { ascending: false });
  return { data, error };
};

export const actualizarEstadoPedido = async (id_pedido, nuevoEstado) => {
  const { data, error } = await supabase
   .from('pedido')
   .update({ estado: nuevoEstado })
   .eq('id_pedido', id_pedido)
   .select();
  return { data, error };
};

export const eliminarPedido = async (id_pedido) => {
  await supabase.from('detalle_pedido').delete().eq('id_pedido', id_pedido);
  const { data, error } = await supabase.from('pedido').delete().eq('id_pedido', id_pedido).select();
  return { data, error };
};