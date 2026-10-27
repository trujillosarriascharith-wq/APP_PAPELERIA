import { crearCodigoRecuperacion, obtenerCodigoValido , marcarComoUsado} from "../models/recuperar.js";
import { obtenerPorEmail, actualizarUsuario } from "../models/user.js";
import nodemailer from 'nodemailer';
import bcrypt from 'bcrypt';

// configuramos el transporte de nodemailer(permite enviar correos)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// configurar la logica para enviar el correo de recuperacion 
export const forgotpassword = async (req, res) => {
    try {
        const { email } = req.body;
         
        if (!email) {
            return res.status(400).json({ error: 'El correo es requerido' });
        }

        // 1. Verificar si el usuario existe (Usando tu modelo con .single())
        const { data: usuario, error: errorusuario } = await obtenerPorEmail(email);

        // Si Supabase devuelve un error (como PGRST116 de que no encontró filas) o 'usuario' es undefined
        if (errorusuario || !usuario) {
            console.log("Aviso: Usuario no encontrado o error en consulta:", errorusuario?.message || "Sin datos");
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // 2. Generar codigo de recuperacion 
        const codigo = Math.floor(100000 + Math.random() * 900000).toString(); // codigo de 6 digitos

        // 3. Guardar el codigo en la base de datos
        const { error: errorCodigo } = await crearCodigoRecuperacion(usuario.id_usuario, codigo);

        if (errorCodigo) {
            console.error("Error al insertar el código en la base de datos:", errorCodigo);
            return res.status(500).json({ error: 'error al generar el codigo de recuperacion' });
        }

        // 4. Creamos el email de codigo de recuperacion 
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: `Tu código de recuperación es: ${codigo}`,
            html: `
                <h2> recuperacion de contraseña </h2>
                <p>Hola ${usuario.nombre || 'usuario'},</p>
                <p>Tu código de recuperación es:</p>
                <h1 style="color: #de15a2; font-size: 36px;">${codigo}</h1>
                <p> este codigo es valido por 15 minutos. si no solicitaste este correo, por favor ignóralo. </p>
                <p> gracias,</p>
                <p>el equipo de soporte </p>
                <p>no compartas este codigo con nadie </p>
            `
        });

        return res.status(200).json({ message: 'codigo de recuperacion enviado al correo' });

    } catch (error) {
        console.error('error en forgotPassword:', error);
        return res.status(500).json({ error: 'error al enviar el correo ' });
    }
};

//cambiar contraseña y verificar el codigo de recuperacion
export const  verifyCode= async (req,res)=>{

try {
const { email, codigo, nuevapassword } = req.body;

//verificamos las entradas
if (!email || !codigo || !nuevapassword) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
}

//veridicamos si el usuario  esta en la base de datos
const { data: usuario} = await obtenerPorEmail(email);

if (!usuario) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
}

//verificamos el codigo de recuperacion

const { data: codigoRecord} = await obtenerCodigoValido(usuario.id_usuario, codigo);
if (!codigoRecord) {
    return res.status(400).json({ error: 'Codigo de recuperacion invalido o expirado' });
}

// encriptamos la nueva contraseña

const hashedpassword = await bcrypt.hash(nuevapassword, 10);

//actualizamos la contraseña del usuario en la base de datos
const { error: updateError } = await actualizarUsuario( usuario.id_usuario,{password: hashedpassword})
if (updateError)  throw updateError;

//marcamos el codigo como usado

await marcarComoUsado(codigoRecord.id);


//respondemos al cliente que la contraseña se ha actualizado correctamente
await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Contraseña actualizada correctamente',
    html: `
    <div style="font-family: Arial , sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border:  1px solid #ddd; pading: 20px;
     border-radius: 5px; ">
     <h2 style="color: #333;">Notificación de cambio de contraseña</h2>
        <p>Hola ${usuario.nombre || 'usuario'},</p>
        <p>Te informamos que tu contraseña ha sido actualizada correctamente. </p>
        <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #39a900; margin-top: 20px;">
        <p style="margin: 0; font-size: 14px  color: #555;">
        Si no realizaste este cambio, te recomendamos que contactes con nuestro soporte inmediatamente.</p>
        </div>
        <p style=color: #555; font-size: 14px;margin-top 30px">Gracias,</p>
        </div>
      
    `

});

return res.status(200).json({ message: 'Contraseña actualizada correctamente' });

} catch (error) {
    console.error('Error en verifyCode:', error);
    return res.status(500).json({ error: 'Error al verificar el código '});
   
  }
};
 