import { supabase } from "../config/supabase.js";

// Obtener el carrito activo de un usuario
export const obtenerCarritoPorUsuario = async (id_usuario) => {
    const {data, error} = await supabase
   .from('carrito')
   .select('*')
   .eq('id_usuario', id_usuario)
   .maybeSingle();
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

// Obtener el detalle (items) de un carrito
export const obtenerDetalleCarrito = async (id_carrito) => {
    const {data, error} = await supabase
   .from('detalle_carrito')
   .select('id_detalle_carrito, id_carrito, id_producto, cantidad')
   .eq('id_carrito', id_carrito);
    return {data, error};
};

export const obtenerDetalleCarritoPorProducto = async (id_carrito, id_producto) => {
    const {data, error} = await supabase
   .from('detalle_carrito')
   .select('id_detalle_carrito, id_carrito, id_producto, cantidad')
   .eq('id_carrito', id_carrito)
   .eq('id_producto', id_producto)
   .maybeSingle();
    return {data, error};
};

export const agregarDetalleCarrito = async (id_carrito, id_producto, cantidad) => {
    const {data, error} = await supabase
   .from('detalle_carrito')
   .insert({ id_carrito, id_producto, cantidad })
   .select('id_detalle_carrito, id_carrito, id_producto, cantidad');
    return {data, error};
};

export const actualizarCantidadDetalle = async (id_detalle_carrito, cantidad) => {
    const {data, error} = await supabase
   .from('detalle_carrito')
   .update({ cantidad })
   .eq('id_detalle_carrito', id_detalle_carrito)
   .select('id_detalle_carrito, id_carrito, id_producto, cantidad');
    return {data, error};
};

export const eliminarDetalleCarrito = async (id_detalle_carrito) => {
    const {data, error} = await supabase
   .from('detalle_carrito')
   .delete()
   .eq('id_detalle_carrito', id_detalle_carrito);
    return {data, error};
};

export const vaciarCarritoPorUsuario = async (id_usuario) => {
  const { data: carrito } = await supabase.from('carrito').select('id_carrito').eq('id_usuario', id_usuario).maybeSingle();
  if (!carrito) return { data: null, error: null };
  const { data, error } = await supabase.from('detalle_carrito').delete().eq('id_carrito', carrito.id_carrito);
  return {data, error};
};

export const vaciar = vaciarCarritoPorUsuario;
export const obtenerCarrito = obtenerCarritoPorUsuario;

// ESTA ES LA UNICA QUE CAMBIA - AHORA SIN.single() EN DETALLE
export const obtenerCarritoConProductosParaPedido = async (id_usuario) => {
  const { data: carrito, error: errorCarrito } = await supabase
   .from('carrito')
   .select('id_carrito')
   .eq('id_usuario', id_usuario)
   .maybeSingle();

  if (errorCarrito) return { data: null, error: errorCarrito };
  if (!carrito) return { data: [], error: null };

  const { data: detalles, error: errorDet } = await supabase
   .from('detalle_carrito')
   .select('id_producto, cantidad')
   .eq('id_carrito', carrito.id_carrito);

  if (errorDet) return { data: null, error: errorDet };
  if (!detalles || detalles.length === 0) return { data: [], error: null };

  const ids = detalles.map(d => d.id_producto);
  const { data: productos, error: errorProd } = await supabase
   .from('productos')
   .select('id_producto, nombre, precio')
   .in('id_producto', ids);

  if (errorProd) return { data: null, error: errorProd };

  const dataFinal = detalles.map(item => {
    const prod = productos.find(p => p.id_producto === item.id_producto);
    return { id_producto: item.id_producto, cantidad: item.cantidad, producto: prod };
  });

  return { data: dataFinal, error: null };
};

export const obtenerCarritoParaPedido = obtenerCarritoConProductosParaPedido;