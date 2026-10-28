import { supabase } from '../config/supabase.js';

const COLUMNAS = 'id_comprobante, id_usuario, id_pedido, imagen, estado, usado, fecha, fecha_validacion, validado_por';

export const crearComprobante = async ({ id_usuario, imagen }) => {
    const { data, error } = await supabase
        .from('comprobantes')
        .insert([{ id_usuario, imagen, estado: 'pendiente', usado: false, fecha: new Date().toISOString() }])
        .select(COLUMNAS);
    return { data, error };
};

export const obtenerComprobantePorId = async (id) => {
    const { data, error } = await supabase
        .from('comprobantes')
        .select(COLUMNAS)
        .eq('id_comprobante', id)
        .maybeSingle();
    return { data, error };
};

// Último comprobante del usuario que aún se puede usar (pendiente o aprobado, sin usar)
export const obtenerComprobanteVigente = async (id_usuario) => {
    const { data, error } = await supabase
        .from('comprobantes')
        .select(COLUMNAS)
        .eq('id_usuario', id_usuario)
        .eq('usado', false)
        .in('estado', ['pendiente', 'aprobado'])
        .order('id_comprobante', { ascending: false })
        .limit(1)
        .maybeSingle();
    return { data, error };
};

export const listarComprobantes = async (estado) => {
    let consulta = supabase
        .from('comprobantes')
        .select(COLUMNAS)
        .order('id_comprobante', { ascending: false });
    if (estado) consulta = consulta.eq('estado', estado);
    const { data, error } = await consulta;
    return { data, error };
};

// El administrador aprueba o rechaza: queda registrado quién y cuándo
export const actualizarEstadoComprobante = async (id, estado, validado_por) => {
    const { data, error } = await supabase
        .from('comprobantes')
        .update({ estado, validado_por, fecha_validacion: new Date().toISOString() })
        .eq('id_comprobante', id)
        .select(COLUMNAS);
    return { data, error };
};

export const marcarComprobanteUsado = async (id, id_pedido) => {
    const { data, error } = await supabase
        .from('comprobantes')
        .update({ usado: true, id_pedido })
        .eq('id_comprobante', id)
        .select(COLUMNAS);
    return { data, error };
};