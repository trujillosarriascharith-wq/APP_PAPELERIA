import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { crearUsuario, obtenerPorEmail } from "../models/user.js";

//registro
export const registro = async (req, res)=>{
     try {
     const  {nombre,telefono, direccion, password , email,}= req.body
 
     //validar datos
      if (!nombre || !telefono || !direccion || !password || !email){
        return res.status (400).json({
            error: 'fatal error'
        });

     }

      //verificar el gamil si ya existe 

      const {data: usuarioExiste } = await obtenerPorEmail(email);
     if( usuarioExiste ){
     return res.status (400).json({
            error: 'el email ya existe '
           });
          }

      // encriptar la contraseña

      const hashedpassword= await bcrypt.hash(password,10);


      // crear la constante para  rol por defautl
       const rolPorDefecto = 'usuario'


      //guardar en la base de datos 
     const {data,error} = await  crearUsuario(
            nombre,
            telefono,
            email,
            direccion,
            hashedpassword,
            rolPorDefecto
          );
          if (error) {
          return res.status(500).json({
            error:"Error al crear el usuario"
        });
     }
     return res.status(201).json({
        message: 'Usuario registrado con éxito',
        usuarios:{
            id_usuario: data[0].id_usuario,
            nombre: data[0].nombre,
            telefono: data[0].telefono,
            direccion: data[0].direccion,
            email: data[0].email,
            rol: data[0].rol
            
        }
     });




      }catch(error){
        console.error("error en el registro", error);
        return res.status(500).json({
            error: error.message
        });

    }
};

//crear el LOGIN
export const login = async(req,res)=>{

    try {
       const {nombre, email,password}  = req.body;

       //validar que los campos esten llenos 
       if ( !nombre || !email || !password){
        return res.status(400).json({
            error: 'Todos los campos son requeridos : email y contraseña'
        });
       }

       //validamos si existe el correo 

       const {data: usuarios} = await obtenerPorEmail(email)
       if(!usuarios){
        return res.status(400).json({
            error: 'El email no esta  registrado'
        });
    }

        //validamos la contrseña
           const passwordValida = await bcrypt.compare(password, usuarios.password);
           if(!passwordValida){
            return res.status(400).json({
                error : 'Contraseña incorrecta '
            })
           };

       
       //generamos el token JWT
       const token = jwt.sign(
        {
            id_usuario: usuarios.id_usuario,
            nombre: usuarios.nombre,
            telefono: usuarios.telefono,
            direccion: usuarios.direccion,
            email: usuarios.email,
            rol: usuarios.rol
            
        },
        process.env.JWT_SECRET,
        {expiresIn: '1h'}
       );
       return res.status(200).json({
        message: 'Login exitoso',
        token,
         usuario: {
            id_usuario: usuarios.id_usuario,
            nombre: usuarios.nombre,
            telefono: usuarios.telefono,
            direccion: usuarios.direccion,
            email: usuarios.email,
            rol : usuarios.rol
         }
    });

    
 } catch (error){
        console.error("Error en el login", error);
        return res.status(500).json({
            error: error.message
        });

    }
};