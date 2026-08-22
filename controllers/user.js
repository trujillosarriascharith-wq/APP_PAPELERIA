import { obtenerUsuarios as obtenerUsuariosModel, obtenerUsuarioPorId , actualizarUsuario,  eliminarUsuario} from "../models/user.js";
import bcrypt from 'bcrypt';

//obtener todos los usuarios
export const  obtenerUsuarios=async (req,res)=>{
    try {
        //Aquí llamamos a la función del modelo renombrada
        const {data,error}= await obtenerUsuariosModel();
        if(error){
            return res.status(500).json({error:'Error al obtener los usuarios'});
        }
        return res.status(200).json({
            usuarios:data
        })
    }catch (error) {
        console.error('Error al obtener los usuarios:' , error);
        return res.status(500).json({error:'Error al obtener los usuarios:'});
    }
    
};

//usuario por id

export const getUsuarioPorId = async (req,res)=>{
    try{
        const { id_usuario } = req.params;
        const{ data,error} = await obtenerUsuarioPorId(id_usuario);
        
        if (error || !data) {
            return res.status(404).json({error: ' Usuario no encontrado'});
        }
        return res.status(200).json({
            usuarios : data
        });
        
    }catch (error) {
        console.error('Error al obtener usuario :',error);
        return res.status(500).json({error:'Error al obtener usuario'});
    }
    
}

//actualizar usuario por ID
export const actualizarUsuarioPorId = async (req,res) =>{
    try {
        const { id_usuario} = req.params;
        const { nombre, email } = req.body;
    } catch (error) {
        console.error('')
    }
    
}

//actualizar usuario

export const updateUsuario = async (req, res) =>{
    try{
        const {id_usuario} = req.params;
        const campos = req.body;
        if (campos.password){
            const hashedpassword = await bcrypt.hash(campos.password, 10);
            campos.password = hashedpassword;
        }
        const {data, error} = await actualizarUsuario (id_usuario,campos);
        if(error){
            return res.status(404).json({
                error:'error al actualizar el usuario'
            });
        }
        return res.status(200).json({
            usuarios: data
        });

    }catch(error){
        console.error('error al actualizar el usuario', error);
        return res.status(500).json({
            error: 'error al actualizar el usuario'
        });
    }

}


//eliminar usuario 

export const Deleteusuario = async (req, res) => {
    try {
            const { id_usuario } = req.params;
            const { data, error } = await eliminarUsuario(id_usuario);

            if (error || !data) {
                return res.status(404).json({ error: 'Usuario no eliminado' });
            }
            return res.status(200).json({
                 usuario: data 
                });

    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        return res.status(500).json({ error: 'Error al eliminar usuario' });
    }
}