import { supabase } from "../config/supabase.js";
//crear codigo de recuperacion 
export const crearCodigoRecuperacion = async (usuarioId, codigo) => {
    const expiresAt = new Date (Date.now()+15 * 60 * 1000); //expira en 15 minutos

    const {data, error }= await supabase
    .from ('recovery_codes')
    .insert({
        id_usuario: usuarioId,
        codigo: codigo,
        expires_at : expiresAt.toISOString()

    })
    .select ()
     return{data , error};

};

//obtener codigo no utilizado por usuario
export const obtenerCodigoValido = async (usuarioId , codigo)=>{
    const {data, error } = await supabase
    .from ('recovery_codes')
    .select ('*')
    .eq ('id_usuario', usuarioId)
    .eq ('codigo' , codigo)
    .eq ('usado', false)
    .gt ('expires_at', new Date().toISOString() )
    .single ();

    return{data , error};
};

//marcar codigo como usado 
export const marcarComoUsado = async (codigoId)=>{
    const {data, error } = await supabase
    .from ('recovery_codes')
    .update({usado: true})
    .eq ('id', codigoId);

    return{data , error};

};