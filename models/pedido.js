import { supabase } from "../config/supabase.js";

export const crearPedido = async (pedidoData) => {
  const { data, error } = await supabase
    .from('pedido').insert(pedidoData).select();
  return { data, error };
};

export const obtenerPedidoConDetalles = async (id_pedido) => {
  const { data, error } = await supabase
    .from('pedido')
    .select(`
      *,
      usuario:id_usuario(id_pedido, nombre, email),
      detalles:detalle_pedido(
        id_detalle, cantidad, precio_unitario, subtotal,
        helado:id_producto(id_producto, nombre, imagen_url)
      )
    `)
    .eq('id_pedido', id_pedido).single();
  return { data, error };
};

export const obtenerPedidosPorUsuario = async (Idusario) => {
  const { data, error } = await supabase
    .from('pedido').select('*')
    .eq('id_usuario', Idusario)
    .order('fecha', { ascending: false });
  return { data, error };
};

export const actualizarEstadoPedido = async (id_pedido, estado) => {
  const { data, error } = await supabase
  .from('pedido')
    .update({ estado, actualizado_en: new Date() })
    .eq('id_pedido', id_pedido).select();
  return { data, error };
};


export const crearDetallePedido = async (detalleData) => {
  const { data, error } = await supabase
    .from('detalle_pedido').insert(detalleData).select();
  return { data, error };
};