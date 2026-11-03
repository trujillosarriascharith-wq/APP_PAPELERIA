// import { BrevoClient } from '@getbrevo/brevo';

// export const enviarCodigoVerificacion = async (emailDestino, nombreDestino, codigo) => {
//   try {
//     const brevo = new BrevoClient({
//       apiKey: process.env.BREVO_API_KEY
//     });

//     const result = await brevo.transactionalEmails.sendTransacEmail({
//       subject: 'Codigo de verificacion - Papeleria Juan Jose',
//       sender: {
//         name: process.env.EMAIL_FROM_NAME || 'Papeleria Juan Jose',
//         email: process.env.EMAIL_USER
//       },
//       to: [
//         {
//           email: emailDestino,
//           name: nombreDestino
//         }
//       ],
//       htmlContent: `
//         <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #f0e6e6; border-radius: 12px; background-color: #ffffff;">
//           <h2 style="color: #d81b60; text-align: center; margin-bottom: 8px;">Papeleria Juan Jose</h2>
//           <h3 style="color: #333333; text-align: center; margin-top: 0;">Verifica tu cuenta</h3>

//           <p style="color: #555555; font-size: 15px;">Hola <strong>${nombreDestino}</strong>,</p>
//           <p style="color: #555555; font-size: 15px;">Gracias por unirte a Papeleria Juan Jose. Usa el siguiente codigo de verificacion de 6 digitos para activar tu cuenta. Este codigo vencera en <strong>15 minutos</strong>:</p>

//           <div style="text-align: center; margin: 30px 0;">
//             <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #d81b60; background: #fdf2f4; padding: 12px 24px; border-radius: 8px; border: 1px dashed #d81b60; display: inline-block;">
//               ${codigo}
//             </span>
//           </div>

//           <p style="color: #888888; font-size: 12px; text-align: center; margin-top: 30px;">
//             Si no creaste una cuenta en Papeleria Juan Jose, puedes ignorar este correo.
//           </p>
//         </div>
//       `
//     });

//     console.log('Correo enviado con exito a', emailDestino);
//     return { exito: true, result };
//   } catch (error) {
//     console.error(
//       'Error enviando correo con Brevo:',
//       error?.statusCode || '',
//       error?.body || error?.message || error
//     );
//     return { exito: false, error };
//   }
// };

//correcto
// import nodemailer from 'nodemailer';

// const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS
//     }
// });

// export const enviarCodigoVerificacion = async (email, nombre, codigo) => {
//     try {
//         await transporter.sendMail({
//             from: `"${process.env.EMAIL_FROM_NAME || 'Papeleria Juan Jose'}" <${process.env.EMAIL_USER}>`,
//             to: email,
//             subject: `Tu código de verificación es: ${codigo}`,
//             html: `
//                 <h2>¡Hola ${nombre || 'usuario'}!</h2>
//                 <p>Gracias por registrarte en Papelería Juan José.</p>
//                 <p>Tu código de verificación es:</p>
//                 <h1 style="color: #de15a2; font-size: 40px; letter-spacing: 5px;">${codigo}</h1>
//                 <p>Este código vence en 15 minutos.</p>
//                 <br>
//                 <p>El equipo de Papelería Juan José</p>
//             `
//         });
//         console.log(`Código enviado a ${email}`);
//         return { exito: true };
//     } catch (error) {
//         console.error('Error enviando con Gmail:', error);
//         return { exito: false, error };
//     }
// };
//2
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true para 465, false para 587
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        ciphers: 'SSLv3'
    }
});

export const enviarCodigoVerificacion = async (emailDestino, nombreDestino, codigo) => {
  try {
    console.log('Intentando enviar a:', emailDestino, 'desde:', process.env.EMAIL_USER);
   
    const info = await transporter.sendMail({
      from: `"Papeleria Juan Jose" <${process.env.EMAIL_USER}>`,
      to: emailDestino,
      subject: `Codigo de verificacion - ${codigo} - Papeleria Juan Jose`,
      html: `
        <div style="font-family: Arial; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #d81b60; text-align: center;">Papeleria Juan Jose</h2>
          <p>Hola <b>${nombreDestino}</b>, tu codigo es:</p>
          <div style="text-align: center; margin: 20px 0;">
            <span style="font-size: 35px; font-weight: bold; letter-spacing: 5px; color: #d81b60; background: #fdf2f4; padding: 10px 20px; border-radius: 8px;">
              ${codigo}
            </span>
          </div>
          <p style="font-size: 12px; color: #888;">Vence en 15 min.</p>
        </div>
      `
    });

    console.log('Correo enviado ID:', info.messageId);
    return { exito: true, messageId: info.messageId };
  } catch (error) {
    console.error('ERROR REAL DE GMAIL:', error);
    return { exito: false, error: error.message };
  }
};
