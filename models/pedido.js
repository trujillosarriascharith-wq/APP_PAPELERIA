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
      detalles:detalle_pedido(
        id_detalle, cantidad, precio, total_parcial,
        producto:id_producto(id_producto, nombre, imagen_url)
      )
    `)
   .eq('id_pedido', id_pedido).single();
  return { data, error };
};

export const obtenerPedidosPorUsuario = async (id_usuario) => {
  const { data, error } = await supabase.from('pedido').select('*').eq('id_usuario', id_usuario).order('fecha', { ascending: false });
  return { data, error };
};

export const crearDetallePedido = async (detalleData) => {
  const { data, error } = await supabase
   .from('detalle_pedido').insert(detalleData).select();
  return { data, error };
};