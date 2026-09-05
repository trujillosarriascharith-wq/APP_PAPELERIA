import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {supabase} from "../config/supabase.js";
import { crearUsuario, obtenerPorEmail } from "../models/user.js";
import { enviarCodigoVerificacion } from "../services/emailService.js";

//registro
export const registro = async (req, res)=>{
     try {
     const  {nombre,telefono, direccion, password , email,}= req.body
 
     //1.validar datos que lleguen todos los campos requeridos
      if (!nombre || !telefono || !direccion || !password || !email){
        return res.status (400).json({
            error: 'Todos los campos son requeridos : nombre, telefono, direccion, password y email'
        });

     }

      //2.verificar el gamil si ya existe 

      const {data: usuarioExiste } = await obtenerPorEmail(email);
     if( usuarioExiste ){
     return res.status (400).json({
            error: 'el email ya existe '
           });
          }

      //3.encriptar la contraseña

      const hashedpassword= await bcrypt.hash(password,10);


      //4.crear la constante para  rol por defecto
       const rolPorDefecto = 'usuario';

       //5.Generar codigo de 6 digitos con Math.random() y   fecha de expiracion(15 minutos) del codigo
       const codigoVerificacion = Math.floor(100000 + Math.random() * 900000).toString();
       const codigoVerificacionExpiracion = new Date(Date.now() + 15 * 60 * 1000) .toISOString(); // 15 minutos a partir de ahora


      //6.guardar en la base de datos 
     const {data,error} = await  crearUsuario(
            nombre,
            telefono,
            email,
            direccion,
            hashedpassword,
            rolPorDefecto,
            codigoVerificacion,
            codigoVerificacionExpiracion
          );
          if (error) {
          return res.status(500).json({
            error:"Error al crear el usuario en la base de datos"
        });
     }

     //7.Enviar el correo  con el codigo de 6 digitos usando Brevo
      const resultadoEnvio = await enviarCodigoVerificacion(email, nombre, codigoVerificacion);

      //8.Normalizar el objeto de usuario (soporta formato con o sin  .single())
      const usuarioCreado = Array.isArray(data) ? data[0] : data;
      
      const usuarioRespuesta ={
        id_usuario: usuarioCreado.id_usuario,
        nombre: usuarioCreado.nombre,
        telefono: usuarioCreado.telefono,
        direccion: usuarioCreado.direccion,
        email: usuarioCreado.email,
        rol: usuarioCreado.rol
      };

      //9.Si Breve fallo, el usuario ya quedo creado , pero avisamos que el correo no llego 
      if (!resultadoEnvio) {
        return res.status(201).json({
            message: 'Tu cuenta fue creada , pero hubo un problema enviando el codigo  de verificacion  a tu correo.Intenta registrarte de nuevo en unos minutos o contacta soporte.',
            emailEnviado: false,
            usuarios: usuarioRespuesta
        });
        
      }

      return res.status(201).json({
     message: 'Usuario registrado con éxito. Hemos enviado un codigo de 6 digitos a tu correo.',
    emailEnviado: true,
    usuarios: usuarioRespuesta
    });

      } catch (error) {
         console.error("error en el registro", error);
         return res.status(500).json({
            error: error.message
            
            });

        }
     };


//       }catch(error){
//         console.error("error en el registro", error);
//         return res.status(500).json({
//             error: error.message
//         });

//     }
// };

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
            error: 'Crdenciales incorrectas'
        });
    }

        //validamos la contrseña
           const passwordValida = await bcrypt.compare(password, usuarios.password);
           if(!passwordValida){
            return res.status(400).json({
                error : 'Crdenciales incorrectas'
            })
           };

           //verificamos si el usuario ha sido verificado
         if (!usuarios.isVerificado) {
            return res.status(403).json({
                error: 'Tu cuenta no ha sido verificada. Por favor ingrese el codigo enviado a tu correo antes de iniciar sesion.'
            });
        }

       
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
        message: 'Inicio de sesion exitoso',
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

//verificar cuenta con codigo de 6 digitos
export const verificarCuenta = async (req, res) => {
    try {
        const { email, codigoVerificacion } = req.body;

        if (!email || !codigoVerificacion) {
            return res.status(400).json({
                error: 'El Email y codigo de verificación son requeridos'
            });
        }

        //1.Buscar el usuario en supabase 
        const { data: usuario, error: errorUsuario } = await  supabase
            .from('usuarios')
            .select('id_usuario, nombre, telefono, direccion, email, rol, isVerificado, codigoVerificacion, codigoVerificacionExpiracion')
            .eq('email', email)
            .single();

        if (errorUsuario || !usuario) {
            return res.status(404).json({
                error: 'Usuario no encontrado'
            });
        }

        //2.Verificar si  ya esta activo
        if (usuario.isVerificado) {
            return res.status(400).json({
                error: 'La cuenta ya se encuentra verificada'
            });
        }

        //3.comparar el codigo 

        if (String(usuario.codigoVerificacion) .trim() !== String(codigo) .trim()) {
            return res.status(400).json({
                error: 'Codigo de verificación es  incorrecto'
            });
        }

        //4.verificar  expiracion (15 minutos)
        const ahora = new Date();
        const expiracion = new Date(usuario.codigoVerificacionExpiracion);
        if (ahora > expiracion) {
            return res.status(400).json({
                error: 'El codigo  ha expirado. Por favor solicita un nuevo codigo.'
            });
        }

        //5.Activar la cuenta
        const { error: errorUpdate } = await supabase
            .from('usuarios')
            .update({ 
                isVerified: true, 
                codigoVerificacion: null,
                codigoVerificacionExpiracion: null
             })
             .eq('id_usuario', usuario.id_usuario);

        if (errorUpdate) {
            return res.status(500).json({
                error: 'Error al actualizar el estado de verificación '
            });
        }

        return res.status(200).json({
            message: 'Cuenta verificada éxitosamente. Ahora puedes iniciar sesión en Papeleria Juan Jose.'
        });

    } catch (error) {
        console.error("Error en verificarCuenta", error);
        return res.status(500).json({
            error: error.message
        });
    }   

};
        






