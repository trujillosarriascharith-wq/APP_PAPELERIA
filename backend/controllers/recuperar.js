// import { crearCodigoRecuperacion, obtenerCodigoValido , marcarComoUsado} from "../models/recuperar.js";
// import { obtenerPorEmail, actualizarUsuario } from "../models/user.js";
// import nodemailer from 'nodemailer';
// import bcrypt from 'bcrypt';

// // configuramos el transporte de nodemailer(permite enviar correos)
// const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS
//     }
// });

// // configurar la logica para enviar el correo de recuperacion 
// export const forgotpassword = async (req, res) => {
//     try {
//         const { email } = req.body;
         
//         if (!email) {
//             return res.status(400).json({ error: 'El correo es requerido' });
//         }

//         // 1. Verificar si el usuario existe (Usando tu modelo con .single())
//         const { data: usuario, error: errorusuario } = await obtenerPorEmail(email);

//         // Si Supabase devuelve un error (como PGRST116 de que no encontró filas) o 'usuario' es undefined
//         if (errorusuario || !usuario) {
//             console.log("Aviso: Usuario no encontrado o error en consulta:", errorusuario?.message || "Sin datos");
//             return res.status(404).json({ error: 'Usuario no encontrado' });
//         }

//         // 2. Generar codigo de recuperacion 
//         const codigo = Math.floor(100000 + Math.random() * 900000).toString(); // codigo de 6 digitos

//         // 3. Guardar el codigo en la base de datos
//         const { error: errorCodigo } = await crearCodigoRecuperacion(usuario.id_usuario, codigo);

//         if (errorCodigo) {
//             console.error("Error al insertar el código en la base de datos:", errorCodigo);
//             return res.status(500).json({ error: 'error al generar el codigo de recuperacion' });
//         }

//         // 4. Creamos el email de codigo de recuperacion 
//         await transporter.sendMail({
//             from: process.env.EMAIL_USER,
//             to: email,
//             subject: `Tu código de recuperación es: ${codigo}`,
//             html: `
//                 <h2> recuperacion de contraseña </h2>
//                 <p>Hola ${usuario.nombre || 'usuario'},</p>
//                 <p>Tu código de recuperación es:</p>
//                 <h1 style="color: #de15a2; font-size: 36px;">${codigo}</h1>
//                 <p> este codigo es valido por 15 minutos. si no solicitaste este correo, por favor ignóralo. </p>
//                 <p> gracias,</p>
//                 <p>el equipo de soporte </p>
//                 <p>no compartas este codigo con nadie </p>
//             `
//         });

//         return res.status(200).json({ message: 'codigo de recuperacion enviado al correo' });

//     } catch (error) {
//         console.error('error en forgotPassword:', error);
//         return res.status(500).json({ error: 'error al enviar el correo ' });
//     }
// };

// //cambiar contraseña y verificar el codigo de recuperacion
// export const  verifyCode= async (req,res)=>{

// try {
// const { email, codigo, nuevapassword } = req.body;

// //verificamos las entradas
// if (!email || !codigo || !nuevapassword) {
//     return res.status(400).json({ error: 'Todos los campos son requeridos' });
// }

// //veridicamos si el usuario  esta en la base de datos
// const { data: usuario} = await obtenerPorEmail(email);

// if (!usuario) {
//     return res.status(404).json({ error: 'Usuario no encontrado' });
// }

// //verificamos el codigo de recuperacion

// const { data: codigoRecord} = await obtenerCodigoValido(usuario.id_usuario, codigo);
// if (!codigoRecord) {
//     return res.status(400).json({ error: 'Codigo de recuperacion invalido o expirado' });
// }

// // encriptamos la nueva contraseña

// const hashedpassword = await bcrypt.hash(nuevapassword, 10);

// //actualizamos la contraseña del usuario en la base de datos
// const { error: updateError } = await actualizarUsuario( usuario.id_usuario,{password: hashedpassword})
// if (updateError)  throw updateError;

// //marcamos el codigo como usado

// await marcarComoUsado(codigoRecord.id);


// //respondemos al cliente que la contraseña se ha actualizado correctamente
// await transporter.sendMail({
//     from: process.env.EMAIL_USER,
//     to: email,
//     subject: 'Contraseña actualizada correctamente',
//     html: `
//     <div style="font-family: Arial , sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border:  1px solid #ddd; pading: 20px;
//      border-radius: 5px; ">
//      <h2 style="color: #333;">Notificación de cambio de contraseña</h2>
//         <p>Hola ${usuario.nombre || 'usuario'},</p>
//         <p>Te informamos que tu contraseña ha sido actualizada correctamente. </p>
//         <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #39a900; margin-top: 20px;">
//         <p style="margin: 0; font-size: 14px  color: #555;">
//         Si no realizaste este cambio, te recomendamos que contactes con nuestro soporte inmediatamente.</p>
//         </div>
//         <p style=color: #555; font-size: 14px;margin-top 30px">Gracias,</p>
//         </div>
      
//     `

// });

// return res.status(200).json({ message: 'Contraseña actualizada correctamente' });

// } catch (error) {
//     console.error('Error en verifyCode:', error);
//     return res.status(500).json({ error: 'Error al verificar el código '});
   
//   }
// };
//codigo de a hora 5:26 
//  import { crearCodigoRecuperacion, obtenerCodigoValido , marcarComoUsado} from "../models/recuperar.js";
// import { obtenerPorEmail, actualizarUsuario } from "../models/user.js";
// import nodemailer from 'nodemailer';
// import bcrypt from 'bcrypt';

// const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS
//     }
// });

// // ENVIO RAPIDO
// export const forgotpassword = async (req, res) => {
//     try {
//         const { email } = req.body;
//         if (!email) {
//             return res.status(400).json({ error: 'El correo es requerido' });
//         }

//         const { data: usuario, error: errorusuario } = await obtenerPorEmail(email);

//         if (errorusuario || !usuario) {
//             console.log("Aviso: Usuario no encontrado:", errorusuario?.message);
//             return res.status(404).json({ error: 'Usuario no encontrado' });
//         }

//         const codigo = Math.floor(100000 + Math.random() * 900000).toString();

//         const { error: errorCodigo } = await crearCodigoRecuperacion(usuario.id_usuario, codigo);
//         if (errorCodigo) {
//             console.error("Error al insertar código:", errorCodigo);
//             return res.status(500).json({ error: 'error al generar el codigo de recuperacion' });
//         }

//         // 1. RESPONDEMOS AL INSTANTE A LA APP - YA NO ESPERAMOS A GMAIL
//         res.status(200).json({ message: 'codigo de recuperacion enviado al correo' });

//         // 2. MANDAMOS EL CORREO EN SEGUNDO PLANO (sin await)
//         transporter.sendMail({
//             from: process.env.EMAIL_USER,
//             to: email,
//             subject: `Tu código de recuperación es: ${codigo}`,
//             html: `
//                 <h2>Recuperacion de contraseña</h2>
//                 <p>Hola ${usuario.nombre || 'usuario'},</p>
//                 <p>Tu código de recuperación es:</p>
//                 <h1 style="color: #de15a2; font-size: 36px;">${codigo}</h1>
//                 <p>Este codigo es valido por 15 minutos. Si no solicitaste este correo, ignóralo.</p>
//                 <p>Gracias,<br>el equipo de soporte</p>
//             `
//         }).then(() => {
//             console.log(`Correo de recuperacion enviado a ${email}`);
//         }).catch(err => {
//             console.error('Error enviando correo en segundo plano:', err);
//         });

//     } catch (error) {
//         console.error('error en forgotPassword:', error);
//         if (!res.headersSent) {
//             return res.status(500).json({ error: 'error al enviar el correo' });
//         }
//     }
// };

// export const verifyCode = async (req,res) => {
//   try {
//     const { email, codigo, nuevapassword } = req.body;
//     if (!email || !codigo || !nuevapassword) {
//         return res.status(400).json({ error: 'Todos los campos son requeridos' });
//     }

//     const { data: usuario} = await obtenerPorEmail(email);
//     if (!usuario) {
//         return res.status(404).json({ error: 'Usuario no encontrado' });
//     }

//     const { data: codigoRecord} = await obtenerCodigoValido(usuario.id_usuario, codigo);
//     if (!codigoRecord) {
//         return res.status(400).json({ error: 'Codigo de recuperacion invalido o expirado' });
//     }

//     const hashedpassword = await bcrypt.hash(nuevapassword, 10);
//     const { error: updateError } = await actualizarUsuario(usuario.id_usuario, {password: hashedpassword})
//     if (updateError) throw updateError;

//     await marcarComoUsado(codigoRecord.id);

//     // Respondemos primero
//     res.status(200).json({ message: 'Contraseña actualizada correctamente' });

//     // Correo de confirmación en segundo plano
//     transporter.sendMail({
//         from: process.env.EMAIL_USER,
//         to: email,
//         subject: 'Contraseña actualizada correctamente',
//         html: `<p>Hola ${usuario.nombre || 'usuario'}, tu contraseña fue actualizada correctamente.</p>`
//     }).catch(err => console.error('Error correo confirmacion:', err));

//   } catch (error) {
//     console.error('Error en verifyCode:', error);
//     if (!res.headersSent) {
//         return res.status(500).json({ error: 'Error al verificar el código'});
//     }
//   }
// };
//codigo que funciona para crear la cuenta no borrar
// import bcrypt from "bcrypt";
// import { supabase } from "../config/supabase.js";
// import { obtenerPorEmail } from "../models/user.js";
// import { enviarCodigoRecuperacion } from "../services/emailService.js";

// // POST /api/auth/forgot-password
// export const forgotpassword = async (req, res) => {
//   try {
//     const { email } = req.body;
//     if (!email) return res.status(400).json({ error: "Email requerido" });

//     const { data: usuario } = await obtenerPorEmail(email);
//     if (!usuario) return res.status(404).json({ error: "Correo no encontrado" });

//     const codigo = Math.floor(100000 + Math.random() * 900000).toString();
//     const expiracion = new Date(Date.now() + 15 * 60 * 1000).toISOString();

//     const { error } = await supabase
//       .from("usuarios")
//       .update({ 
//         codigoRecuperacion: codigo, 
//         codigoRecuperacionExpiracion: expiracion 
//       })
//       .eq("id_usuario", usuario.id_usuario);

//     if (error) return res.status(500).json({ error: "Error guardando codigo" });

//     // Respondemos rapido a la APK
//     res.status(200).json({ message: "Codigo enviado al correo", emailEnviado: true });

//     // Enviamos en segundo plano
//     enviarCodigoRecuperacion(email, usuario.nombre, codigo)
//       .then(r => console.log(`Recuperacion a ${email}: ${r.exito ? 'OK' : 'FALLO'}`))
//       .catch(e => console.error(e));

//   } catch (e) {
//     console.error("forgotpassword error:", e);
//     return res.status(500).json({ error: e.message });
//   }
// };

// // POST /api/auth/verify-code  -> verifica codigo y cambia password
// export const verifyCode = async (req, res) => {
//   try {
//     const { email, codigo, nuevaPassword, password } = req.body;
//     const passFinal = nuevaPassword || password;

//     if (!email || !codigo) return res.status(400).json({ error: "Email y codigo requeridos" });

//     const { data: usuario } = await supabase.from("usuarios").select("*").eq("email", email).single();
//     if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });

//     if (String(usuario.codigoRecuperacion).trim() !== String(codigo).trim()) {
//       return res.status(400).json({ error: "Codigo incorrecto" });
//     }
//     if (new Date() > new Date(usuario.codigoRecuperacionExpiracion)) {
//       return res.status(400).json({ error: "Codigo expirado, solicita otro" });
//     }

//     // Si solo quieren verificar el codigo sin cambiar aun
//     if (!passFinal) {
//       return res.status(200).json({ message: "Codigo valido" });
//     }

//     const hashed = await bcrypt.hash(passFinal, 10);
//     await supabase.from("usuarios").update({
//         password: hashed,
//         codigoRecuperacion: null,
//         codigoRecuperacionExpiracion: null
//       }).eq("id_usuario", usuario.id_usuario);

//     return res.status(200).json({ message: "Contraseña actualizada correctamente" });

//   } catch (e) {
//     console.error("verifyCode error:", e);
//     return res.status(500).json({ error: e.message });
//   }
// };
//no borrar codigo de hoy 3 NOVIEMBRE SIRVE
// import bcrypt from "bcrypt";
// import { supabase } from "../config/supabase.js";
// import { obtenerPorEmail } from "../models/user.js";
// import { enviarCodigoRecuperacion } from "../services/emailService.js";
// import { crearCodigoRecuperacion, obtenerCodigoValido, marcarComoUsado } from "../models/recuperar.js";

// // POST /api/auth/forgot-password
// export const forgotpassword = async (req, res) => {
//   try {
//     const { email } = req.body;
//     if (!email) return res.status(400).json({ error: "Email requerido" });

//     const { data: usuario } = await obtenerPorEmail(email);
//     if (!usuario) return res.status(404).json({ error: "Correo no encontrado" });

//     // Tu tabla usuarios usa "id" no "id_usuario" - usamos el que exista
//     const idUsuario = usuario.id || usuario.id_usuario;

//     const codigo = Math.floor(100000 + Math.random() * 900000).toString();

//     // ESTE ES EL ARREGLO: Guardamos en recovery_codes, no en usuarios
//     const { error } = await crearCodigoRecuperacion(idUsuario, codigo);

//     if (error) {
//       console.error("Error supabase recovery_codes:", error);
//       return res.status(500).json({ error: "Error guardando codigo: " + error.message });
//     }

//     res.status(200).json({ message: "Codigo enviado al correo", emailEnviado: true });

//     // Enviamos con Brevo en segundo plano
//     enviarCodigoRecuperacion(email, usuario.nombre || usuario.name || "usuario", codigo)
//       .then(r => console.log(`Recuperacion a ${email}: ${r.exito ? 'OK' : 'FALLO'}`))
//       .catch(e => console.error(e));

//   } catch (e) {
//     console.error("forgotpassword error:", e);
//     return res.status(500).json({ error: e.message });
//   }
// };

// // POST /api/auth/verify-code
// export const verifyCode = async (req, res) => {
//   try {
//     const { email, codigo, nuevaPassword, password } = req.body;
//     const passFinal = nuevaPassword || password;

//     if (!email || !codigo) return res.status(400).json({ error: "Email y codigo requeridos" });

//     const { data: usuario } = await obtenerPorEmail(email);
//     if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });

//     const idUsuario = usuario.id || usuario.id_usuario;

//     const { data: codigoValido, error } = await obtenerCodigoValido(idUsuario, codigo);
    
//     if (error || !codigoValido) {
//       return res.status(400).json({ error: "Codigo incorrecto o expirado" });
//     }

//     if (!passFinal) {
//       return res.status(200).json({ message: "Codigo valido" });
//     }

//     const hashed = await bcrypt.hash(passFinal, 10);
    
//     // Actualizamos password en usuarios
//     const { error: updateError } = await supabase
//       .from("usuarios")
//       .update({ password: hashed })
//       .eq("id", idUsuario);

//     if (updateError) return res.status(500).json({ error: updateError.message });

//     // Marcamos el codigo como usado
//     await marcarComoUsado(codigoValido.id);

//     return res.status(200).json({ message: "Contraseña actualizada correctamente" });

//   } catch (e) {
//     console.error("verifyCode error:", e);
//     return res.status(500).json({ error: e.message });
//   }
// };
import bcrypt from "bcrypt";
import { supabase } from "../config/supabase.js";
import { obtenerPorEmail } from "../models/user.js";
import { enviarCodigoRecuperacion } from "../services/emailService.js";
import { crearCodigoRecuperacion, obtenerCodigoValido, marcarComoUsado } from "../models/recuperar.js";

// POST /api/auth/forgot-password
export const forgotpassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email requerido" });

    const { data: usuario } = await obtenerPorEmail(email);
    if (!usuario) return res.status(404).json({ error: "Correo no encontrado" });

    const idUsuario = usuario.id || usuario.id_usuario;
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();

    const { error } = await crearCodigoRecuperacion(idUsuario, codigo);

    if (error) {
      console.error("Error supabase recovery_codes:", error);
      return res.status(500).json({ error: "Error guardando codigo: " + error.message });
    }

    res.status(200).json({ message: "Codigo enviado al correo", emailEnviado: true });

    enviarCodigoRecuperacion(email, usuario.nombre || usuario.name || "usuario", codigo)
      .then(r => console.log(`Recuperacion a ${email}: ${r.exito ? 'OK' : 'FALLO'}`))
      .catch(e => console.error(e));

  } catch (e) {
    console.error("forgotpassword error:", e);
    return res.status(500).json({ error: e.message });
  }
};

// POST /api/auth/verify-code -> verifica codigo y cambia password
export const verifyCode = async (req, res) => {
  try {
    const { email, codigo, nuevaPassword, password } = req.body;
    const passFinal = nuevaPassword || password;

    if (!email || !codigo) return res.status(400).json({ error: "Email y codigo requeridos" });

    const { data: usuario } = await obtenerPorEmail(email);
    if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });

    // Detecta si tu tabla usa "id" o "id_usuario"
    const idUsuario = usuario.id || usuario.id_usuario;
    const claveId = usuario.id ? "id" : "id_usuario";

    const { data: codigoValido, error } = await obtenerCodigoValido(idUsuario, codigo);
    
    if (error || !codigoValido) {
      return res.status(400).json({ error: "Codigo incorrecto o expirado" });
    }

    // Si solo quieren verificar el codigo sin cambiar aun
    if (!passFinal) {
      return res.status(200).json({ message: "Codigo valido" });
    }

    const hashed = await bcrypt.hash(passFinal, 10);
    console.log(`Actualizando password para ${email} con ${claveId}=${idUsuario}`);

    const { error: updateError } = await supabase
      .from("usuarios")
      .update({ password: hashed })
      .eq(claveId, idUsuario);

    if (updateError) {
      console.error("Error update password:", updateError);
      return res.status(500).json({ error: "No se pudo actualizar: " + updateError.message });
    }

    await marcarComoUsado(codigoValido.id);

    return res.status(200).json({ message: "Contraseña actualizada correctamente" });

  } catch (e) {
    console.error("verifyCode error:", e);
    return res.status(500).json({ error: e.message });
  }
};