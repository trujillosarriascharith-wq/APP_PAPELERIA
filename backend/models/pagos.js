import {supabase} from "../config/supabase.js";

//Registrar un pago
export const crearPago = async (id_pedido, metodo_pago, monto) => {
    const {data, error} = await supabase
   .from('pagos')
   .insert([{id_pedido, metodo_pago, monto, estado: 'pagado'}])
   .select();
    return {data, error};
};

//Obtener todos los pagos
export const obtenerPagos = async () => {
    const {data, error} = await supabase.from('pagos').select('*');
    return {data, error};
};

//Obtener pagos por pedido
export const obtenerPagoPorPedido = async (id_pedido) => {
    const {data, error} = await supabase.from('pagos').select('*').eq('id_pedido', id_pedido).maybeSingle();
    return {data, error};
};

//Actualizar estado de un pago
export const actualizarEstadoPago = async (id_pago, estado) => {
    const {data, error} = await supabase.from('pagos').update({estado}).eq('id_pago', id_pago).select();
    return {data, error};
};

//Eliminar un pago
export const eliminarPago = async (id_pago) => {
    const {data, error} = await supabase.from('pagos').delete().eq('id_pago', id_pago);
    return {data, error};
};