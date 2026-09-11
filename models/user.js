import { supabase } from "../config/supabase.js";



//crear el usuario
export const crearUsuario = async (nombre, telefono,  email, direccion, password, rol,codigoVerificacion, codigoVerificacionExpiracion) => {
    const { data, error } = await supabase
        .from('usuarios')
        .insert({nombre, telefono, email, direccion, password , rol: rol || 'usuario', isVerified: false, codigoVerificacion, codigoVerificacionExpiracion}) 
        .select('id_usuario ,nombre,telefono, email, direccion, password ,rol')
      
        return {data, error};
    };

    
    //obtener usuarios
export const obtenerUsuarios = async () => {
    const{data,error} =await supabase
    .from('usuarios')
    .select('id_usuario , nombre,telefono,direccion, password, email, rol');
   
    return{data,error};
};

//// 1. Obtener usuario existente por correo 
export const obtenerPorEmail = async (email)=>{
    const {data,error}=await supabase
     .from('usuarios')
     .select('*')
     .eq ('email', email)
     .maybeSingle();

      return{data,error};

};

//obtener un usuario por ID

export const obtenerUsuarioPorId = async (id_usuario) => {
    const {data, error} = await supabase
    .from('usuarios')
    .select ('id_usuario , nombre,telefono,direccion, password, email, rol')
    .eq('id_usuario',id_usuario)
    .single();
    return { data, error};
};

// //actualizar un usuario
// export const actualizarUsuario = async (id_usuario,campos) => {
//     const {data,error} = await supabase
//      .from('usuarios')
//      .update(campos)
//       .eq ('id_usuario', id_usuario)
//     .select('id_usuario , nombre,telefono,direccion, password, email, rol');
//       return{data,error};
// };

// 3. Actualizar campos de vinculación
export const actualizarUsuario = async (id_usuario, campos) => {
    const { data, error } = await supabase
        .from('usuarios')
        .update(campos)
        .eq('id_usuario', id_usuario)
        .select()
        .single();

    return { data, error };
};

//eliminar un usuario 
 export const eliminarUsuario = async (id_usuario) =>{
 const {data,error} = await supabase
     .from('usuarios')
     .delete()
     .eq ('id_usuario', id_usuario)
     .select('id_usuario , nombre,telefono,direccion, password, email, rol');
      return{data,error};
 };

 // 2. Función especifica para los usuarios autenticados con Google
export const crearUsuarioGoogle = async ({ nombre, email, googleId, avatar = null, rol = 'cliente' }) => {
    const { data, error } = await supabase
        .from('usuarios')
        .insert({
            nombre,
            email,
            password: null,       // No requiere contraseña
            rol,
            isVerified: true,     // Google ya validó este correo
            googleId,
            avatar,
            codigoVerificacion: null,
            codigoVerificacionExpiracion: null
        })
        .select('id_usuario, nombre, email, rol, avatar')
        .single();

    return { data, error };
};