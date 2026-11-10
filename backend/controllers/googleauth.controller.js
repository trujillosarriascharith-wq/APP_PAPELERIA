// import jwt from "jsonwebtoken";
// import { OAuth2Client } from "google-auth-library";
// import { obtenerPorEmail, crearUsuarioGoogle, actualizarUsuario } from "../models/user.js";

// const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// export const autenticarConGoogle = async (req, res) => {
//   try {
//     const { idToken } = req.body;

//     if (!idToken) {
//       return res.status(400).json({
//         error: "El idToken de Google es requerido"
//       });
//     }

//     // 1. Validar el token con Google
//     const ticket = await client.verifyIdToken({
//       idToken,
//       audience: process.env.GOOGLE_CLIENT_ID
//     });

//     const payload = ticket.getPayload();
//     const { sub: googleId, email, name: nombre, picture: avatar } = payload;

//     // 2. Comprobar si ya existe en Supabase
//     const { data: usuarioExistente } = await obtenerPorEmail(email);

//     let usuarioFinal = null;

//     if (usuarioExistente) {
//       // LOGIN: Ya existe, actualizamos si faltaba vincular Google

//       usuarioFinal = usuarioExistente;

//       const camposActualizar = {};

//       if (!usuarioExistente.googleId)
//         camposActualizar.googleId = googleId;

//       if (!usuarioExistente.avatar && avatar)
//         camposActualizar.avatar = avatar;

//       if (!usuarioExistente.isVerified)
//         camposActualizar.isVerified = true;

//       if (Object.keys(camposActualizar).length > 0) {
//         await actualizarUsuario(usuarioExistente.id, camposActualizar);
//       }

//     } else {
//       // REGISTRO: Usuario nuevo
//       const { data: nuevoUsuario, error: errorCrear } =
//         await crearUsuarioGoogle({
//           nombre,
//           email,
//           googleId,
//           avatar,
//           rol: "usuario"
//         });

//       if (errorCrear) {
//         return res.status(500).json({
//           error: "Error al registrar el usuario en Supabase",
//           detalle: errorCrear.message
//         });
//       }

//       usuarioFinal = Array.isArray(nuevoUsuario)
//         ? nuevoUsuario[0]
//         : nuevoUsuario;
//     }

//     // 3. Generar token de sesión JWT
//     const token = jwt.sign(
//       {
//         id: usuarioFinal.id,
//         rol: usuarioFinal.rol
//       },
//       process.env.JWT_SECRET,
//       { expiresIn: "1d" }
//     );

//     return res.status(200).json({
//       message: usuarioExistente
//         ? "Inicio de sesión exitoso con Google"
//         : "Registro exitoso con Google",
//       token,
//       usuario: {
//         id_usuario: usuarioFinal.id_usuario,
//         nombre: usuarioFinal.nombre,
//         email: usuarioFinal.email,
//         rol: usuarioFinal.rol,
//         avatar: usuarioFinal.avatar || avatar
//       }
//     });

//   } catch (error) {
//     console.error("Error en autenticarConGoogle:", error);

//     return res.status(401).json({
//       error: "Token de Google inválido o expirado"
//     });
//   }
// };
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { obtenerPorEmail, crearUsuarioGoogle, actualizarUsuario } from "../models/user.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const autenticarConGoogle = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        error: "El idToken de Google es requerido"
      });
    }

    // 1. Validar el token con Google
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name: nombre, picture: avatar } = payload;

    // 2. Comprobar si ya existe en Supabase
    const { data: usuarioExistente } = await obtenerPorEmail(email);

    let usuarioFinal = null;

    if (usuarioExistente) {
      // LOGIN: ya existe, vinculamos Google si faltaba
      usuarioFinal = usuarioExistente;

      const camposActualizar = {};

      if (!usuarioExistente.googleId) camposActualizar.googleId = googleId;
      if (!usuarioExistente.avatar && avatar) camposActualizar.avatar = avatar;
      if (!usuarioExistente.isVerified) camposActualizar.isVerified = true;

      if (Object.keys(camposActualizar).length > 0) {
        // CORREGIDO: la columna es id_usuario (antes se usaba .id, que no existe)
        const { data: actualizado } = await actualizarUsuario(
          usuarioExistente.id_usuario,
          camposActualizar
        );
        if (actualizado) usuarioFinal = actualizado;
      }
    } else {
      // REGISTRO: usuario nuevo
      const { data: nuevoUsuario, error: errorCrear } = await crearUsuarioGoogle({
        nombre,
        email,
        googleId,
        avatar,
        rol: "usuario"
      });

      if (errorCrear) {
        return res.status(500).json({
          error: "Error al registrar el usuario en Supabase",
          detalle: errorCrear.message
        });
      }

      usuarioFinal = Array.isArray(nuevoUsuario) ? nuevoUsuario[0] : nuevoUsuario;
    }

    // 3. Token de sesión con el MISMO contenido que el login normal.
    // verificarToken (perfil.js) lee req.usuario.id_usuario, por eso es obligatorio.
    const token = jwt.sign(
      {
        id_usuario: usuarioFinal.id_usuario,
        nombre: usuarioFinal.nombre,
        telefono: usuarioFinal.telefono ?? null,
        direccion: usuarioFinal.direccion ?? null,
        email: usuarioFinal.email,
        rol: usuarioFinal.rol
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // La app espera "foto"; si no hay, usamos la de Google
    const foto = usuarioFinal.foto || usuarioFinal.avatar || avatar || null;

    return res.status(200).json({
      message: usuarioExistente
        ? "Inicio de sesión exitoso con Google"
        : "Registro exitoso con Google",
      token,
      usuario: {
        id_usuario: usuarioFinal.id_usuario,
        nombre: usuarioFinal.nombre,
        email: usuarioFinal.email,
        telefono: usuarioFinal.telefono ?? null,
        direccion: usuarioFinal.direccion ?? null,
        rol: usuarioFinal.rol,
        foto,
        avatar: foto,
        emailPendiente: null
      }
    });
  } catch (error) {
    console.error("Error en autenticarConGoogle:", error);

    return res.status(401).json({
      error: "Token de Google inválido o expirado"
    });
  }
};