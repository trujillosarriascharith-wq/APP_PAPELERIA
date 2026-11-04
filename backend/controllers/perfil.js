// import jwt from "jsonwebtoken";
// import { v2 as cloudinary } from "cloudinary";
// import { supabase } from "../config/supabase.js";

// // Verifica el token JWT que envía la app
// export const verificarToken = (req, res, next) => {
//     const auth = req.headers.authorization || '';
//     const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
//     if (!token) {
//         return res.status(401).json({ error: 'Token requerido' });
//     }
//     try {
//         req.usuario = jwt.verify(token, process.env.JWT_SECRET);
//         next();
//     } catch (e) {
//         return res.status(401).json({ error: 'Tu sesión expiró. Inicia sesión de nuevo.' });
//     }
// };

// // Sube el archivo (que está en memoria) a Cloudinary
// const subirACloudinary = (buffer) =>
//     new Promise((resolve, reject) => {
//         const stream = cloudinary.uploader.upload_stream(
//             { folder: 'perfiles', resource_type: 'image' },
//             (error, result) => (error ? reject(error) : resolve(result))
//         );
//         stream.end(buffer);
//     });

// // Guarda la foto de perfil
// export const subirFoto = async (req, res) => {
//     try {
//         if (!req.file) {
//             return res.status(400).json({ error: 'No se recibió ninguna imagen' });
//         }

//         // Se configura aquí (y no arriba) para que ya estén cargadas las variables del .env
//         cloudinary.config({
//             cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//             api_key: process.env.CLOUDINARY_API_KEY,
//             api_secret: process.env.CLOUDINARY_API_SECRET,
//         });

//         const resultado = await subirACloudinary(req.file.buffer);
//         const url = resultado.secure_url;

//         const { error } = await supabase
//             .from('usuarios')
//             .update({ foto: url })
//             .eq('id_usuario', req.usuario.id_usuario);

//         if (error) {
//             return res.status(500).json({ error: 'No se pudo guardar la foto' });
//         }

//         return res.status(200).json({ message: 'Foto actualizada', foto: url });
//     } catch (error) {
//         console.error("Error al subir foto", error);
//         return res.status(500).json({ error: error.message });
//     }
// };
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import { supabase } from "../config/supabase.js";
import { enviarCodigoVerificacion } from "../services/emailService.js";

const CAMPOS_PERFIL =
    'id_usuario, nombre, email, telefono, direccion, rol, foto, avatar, googleId, emailPendiente';

const EMAIL_VALIDO = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const TELEFONO_VALIDO = /^[0-9+\s-]{7,20}$/;

// Verifica el token JWT que envía la app
export const verificarToken = (req, res, next) => {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) {
        return res.status(401).json({ error: 'Token requerido' });
    }
    try {
        req.usuario = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (e) {
        return res.status(401).json({ error: 'Tu sesión expiró. Inicia sesión de nuevo.' });
    }
};

// ---------- Utilidades ----------

// Solo los datos que la app puede ver (nunca la contraseña ni los códigos)
const limpiarUsuario = (u) => ({
    id_usuario: u.id_usuario,
    nombre: u.nombre,
    email: u.email,
    telefono: u.telefono,
    direccion: u.direccion,
    rol: u.rol,
    foto: u.foto || u.avatar || null,
    emailPendiente: u.emailPendiente || null,
});

// Token nuevo con los datos actualizados (mismo contenido que en el login)
const firmarToken = (u) =>
    jwt.sign(
        {
            id_usuario: u.id_usuario,
            nombre: u.nombre,
            telefono: u.telefono,
            direccion: u.direccion,
            email: u.email,
            rol: u.rol,
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );

const generarCodigo = () => Math.floor(100000 + Math.random() * 900000).toString();
const expiraEn15Min = () => new Date(Date.now() + 15 * 60 * 1000).toISOString();

// ¿Ese correo ya lo tiene otra cuenta?
const correoEnUso = async (email, idPropio) => {
    const patron = email.replace(/[\\%_]/g, '\\$&'); // escapa comodines de ilike
    const { data } = await supabase
        .from('usuarios')
        .select('id_usuario')
        .ilike('email', patron)
        .neq('id_usuario', idPropio)
        .limit(1);
    return !!(data && data.length > 0);
};

// El correo se envía en segundo plano para no hacer esperar a la app
const enviarCodigoEnSegundoPlano = (email, nombre, codigo) => {
    enviarCodigoVerificacion(email, nombre, codigo)
        .then((r) => console.log(`Código de cambio de correo a ${email}: ${r?.exito ? 'enviado' : 'falló'}`))
        .catch((e) => console.error('Error enviando código de cambio de correo:', e));
};

// Sube el archivo (que está en memoria) a Cloudinary
const subirACloudinary = (buffer) =>
    new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: 'perfiles', resource_type: 'image' },
            (error, result) => (error ? reject(error) : resolve(result))
        );
        stream.end(buffer);
    });

// ---------- Endpoints ----------

// GET /api/perfil -> datos actuales del usuario que inició sesión
export const obtenerPerfil = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('usuarios')
            .select(CAMPOS_PERFIL)
            .eq('id_usuario', req.usuario.id_usuario)
            .maybeSingle();

        if (error) {
            console.error('Error al consultar perfil:', error.message);
            return res.status(500).json({ error: 'No se pudo consultar el perfil' });
        }
        if (!data) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        return res.status(200).json({ usuario: limpiarUsuario(data) });
    } catch (error) {
        console.error('Error al consultar perfil', error);
        return res.status(500).json({ error: error.message });
    }
};

// PUT /api/perfil -> nombre, dirección y teléfono se guardan al instante.
// Si cambia el correo, queda PENDIENTE hasta que se confirme con un código.
export const actualizarPerfil = async (req, res) => {
    try {
        const id = req.usuario.id_usuario;
        const nombre = String(req.body.nombre ?? '').trim();
        const email = String(req.body.email ?? '').trim();
        const direccion = String(req.body.direccion ?? '').trim();
        const telefono = String(req.body.telefono ?? '').trim();

        if (!nombre) {
            return res.status(400).json({ error: 'El nombre no puede estar vacío' });
        }
        if (!EMAIL_VALIDO.test(email)) {
            return res.status(400).json({ error: 'Escribe un correo válido' });
        }
        if (telefono && !TELEFONO_VALIDO.test(telefono)) {
            return res.status(400).json({ error: 'Escribe un teléfono válido' });
        }

        const { data: actual, error: errorActual } = await supabase
            .from('usuarios')
            .select(CAMPOS_PERFIL)
            .eq('id_usuario', id)
            .maybeSingle();

        if (errorActual) {
            return res.status(500).json({ error: 'No se pudo consultar el usuario' });
        }
        if (!actual) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const campos = { nombre, direccion, telefono };
        const cambioCorreo = email.toLowerCase() !== String(actual.email || '').toLowerCase();
        let codigo = null;

        if (cambioCorreo) {
            if (actual.googleId) {
                return res.status(400).json({
                    error: 'Las cuentas de Google no pueden cambiar el correo',
                });
            }
            if (await correoEnUso(email, id)) {
                return res.status(409).json({ error: 'Ese correo ya está registrado en otra cuenta' });
            }

            codigo = generarCodigo();
            campos.emailPendiente = email;
            campos.codigoVerificacion = codigo;
            campos.codigoVerificacionExpiracion = expiraEn15Min();
        }

        const { data, error } = await supabase
            .from('usuarios')
            .update(campos)
            .eq('id_usuario', id)
            .select(CAMPOS_PERFIL)
            .single();

        if (error) {
            console.error('Error al actualizar perfil:', error.message);
            return res.status(500).json({ error: 'No se pudo actualizar el perfil' });
        }

        res.status(200).json({
            message: cambioCorreo
                ? 'Datos guardados. Te enviamos un código al nuevo correo para confirmarlo.'
                : 'Perfil actualizado',
            usuario: limpiarUsuario(data),
            token: firmarToken(data),
            requiereVerificacion: cambioCorreo,
        });

        if (cambioCorreo) enviarCodigoEnSegundoPlano(email, nombre, codigo);
    } catch (error) {
        console.error('Error al actualizar perfil', error);
        return res.status(500).json({ error: error.message });
    }
};

// POST /api/perfil/verificar-email -> confirma el correo nuevo con el código
export const verificarCorreoNuevo = async (req, res) => {
    try {
        const id = req.usuario.id_usuario;
        const codigo = String(req.body.codigo ?? '').trim();

        if (!codigo) {
            return res.status(400).json({ error: 'Escribe el código de verificación' });
        }

        const { data: usuario, error: errorUsuario } = await supabase
            .from('usuarios')
            .select('id_usuario, emailPendiente, codigoVerificacion, codigoVerificacionExpiracion')
            .eq('id_usuario', id)
            .maybeSingle();

        if (errorUsuario || !usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        if (!usuario.emailPendiente) {
            return res.status(400).json({ error: 'No tienes ningún cambio de correo pendiente' });
        }
        if (String(usuario.codigoVerificacion ?? '').trim() !== codigo) {
            return res.status(400).json({ error: 'El código es incorrecto' });
        }
        if (new Date() > new Date(usuario.codigoVerificacionExpiracion)) {
            return res.status(400).json({ error: 'El código expiró. Solicita uno nuevo.' });
        }

        // Por si alguien más tomó ese correo mientras tanto
        if (await correoEnUso(usuario.emailPendiente, id)) {
            return res.status(409).json({ error: 'Ese correo ya está registrado en otra cuenta' });
        }

        const { data, error } = await supabase
            .from('usuarios')
            .update({
                email: usuario.emailPendiente,
                emailPendiente: null,
                codigoVerificacion: null,
                codigoVerificacionExpiracion: null,
            })
            .eq('id_usuario', id)
            .select(CAMPOS_PERFIL)
            .single();

        if (error) {
            if (error.code === '23505') {
                return res.status(409).json({ error: 'Ese correo ya está registrado en otra cuenta' });
            }
            return res.status(500).json({ error: 'No se pudo confirmar el correo' });
        }

        return res.status(200).json({
            message: 'Correo actualizado correctamente',
            usuario: limpiarUsuario(data),
            token: firmarToken(data),
        });
    } catch (error) {
        console.error('Error al verificar correo nuevo', error);
        return res.status(500).json({ error: error.message });
    }
};

// POST /api/perfil/reenviar-codigo -> genera y envía un código nuevo
export const reenviarCodigoCorreo = async (req, res) => {
    try {
        const id = req.usuario.id_usuario;

        const { data: usuario, error: errorUsuario } = await supabase
            .from('usuarios')
            .select('id_usuario, nombre, emailPendiente')
            .eq('id_usuario', id)
            .maybeSingle();

        if (errorUsuario || !usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        if (!usuario.emailPendiente) {
            return res.status(400).json({ error: 'No tienes ningún cambio de correo pendiente' });
        }

        const codigo = generarCodigo();
        const { error } = await supabase
            .from('usuarios')
            .update({
                codigoVerificacion: codigo,
                codigoVerificacionExpiracion: expiraEn15Min(),
            })
            .eq('id_usuario', id);

        if (error) {
            return res.status(500).json({ error: 'No se pudo generar un código nuevo' });
        }

        res.status(200).json({ message: 'Te enviamos un código nuevo' });
        enviarCodigoEnSegundoPlano(usuario.emailPendiente, usuario.nombre, codigo);
    } catch (error) {
        console.error('Error al reenviar código', error);
        return res.status(500).json({ error: error.message });
    }
};

// POST /api/perfil/foto -> guarda la foto de perfil
export const subirFoto = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se recibió ninguna imagen' });
        }

        // Se configura aquí (y no arriba) para que ya estén cargadas las variables del .env
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });

        const resultado = await subirACloudinary(req.file.buffer);
        const url = resultado.secure_url;

        const { error } = await supabase
            .from('usuarios')
            .update({ foto: url })
            .eq('id_usuario', req.usuario.id_usuario);

        if (error) {
            return res.status(500).json({ error: 'No se pudo guardar la foto' });
        }

        return res.status(200).json({ message: 'Foto actualizada', foto: url });
    } catch (error) {
        console.error('Error al subir foto', error);
        return res.status(500).json({ error: error.message });
    }
};