import { supabase } from "../config/supabase.js";

//crear el usuario
export const crearUsuario = async (nombre, telefono,  email, direccion, password, rol) => {
    const { data, error } = await supabase
        .from('usuarios')
        .insert({nombre, telefono, email, direccion, password , rol : rol || 'usuario'}) 
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

//buscar el usuario por email para el login 
export const obtenerPorEmail = async (email)=>{
    const {data,error}=await supabase
     .from('usuarios')
     .select('*')
      .eq ('email', email)
       .single();
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

//actualizar un usuario
export const actualizarUsuario = async (id_usuario,campos) => {
    const {data,error} = await supabase
     .from('usuarios')
     .update(campos)
      .eq ('id_usuario', id_usuario)
    .select('id_usuario , nombre,telefono,direccion, password, email, rol');
      return{data,error};
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