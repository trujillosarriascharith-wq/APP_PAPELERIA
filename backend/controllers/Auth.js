
// import bcrypt from "bcrypt";
// import jwt from "jsonwebtoken";
// import { supabase } from "../config/supabase.js";
// import { crearUsuario, obtenerPorEmail } from "../models/user.js";
// import { enviarCodigoVerificacion } from "../services/emailService.js";
// import { subirFoto } from "../utils/subirFoto.js";

// //registro
// export const registro = async (req, res) => {
//     try {
//         const { nombre, telefono, direccion, password, email } = req.body;

//         if (!nombre || !telefono || !direccion || !password || !email) {
//             return res.status(400).json({
//                 error: 'Todos los campos son requeridos : nombre, telefono, direccion, password y email'
//             });
//         }

//         const { data: usuarioExiste } = await obtenerPorEmail(email);
//         if (usuarioExiste) {
//             return res.status(400).json({
//                 error: 'el email ya existe '
//             });
//         }

//         const hashedpassword = await bcrypt.hash(password, 10);

//         let fotoUrl = null;
//         if (req.file) {
//             try {
//                 fotoUrl = await subirFoto(req.file.buffer);
//             } catch (e) {
//                 console.error("Error subiendo foto", e);
//                 return res.status(500).json({ error: 'No se pudo subir la foto' });
//             }
//         }

//         const rolPorDefecto = 'usuario';
//         const codigoVerificacion = Math.floor(100000 + Math.random() * 900000).toString();
//         const codigoVerificacionExpiracion = new Date(Date.now() + 15 * 60 * 1000).toISOString();

//         const { data, error } = await crearUsuario(
//             nombre,
//             telefono,
//             email,
//             direccion,
//             hashedpassword,
//             rolPorDefecto,
//             codigoVerificacion,
//             codigoVerificacionExpiracion,
//             fotoUrl
//         );
//         if (error) {
//             return res.status(500).json({
//                 error: "Error al crear el usuario en la base de datos"
//             });
//         }

//         const usuarioCreado = Array.isArray(data) ? data[0] : data;

//         const usuarioRespuesta = {
//             id_usuario: usuarioCreado.id_usuario,
//             nombre: usuarioCreado.nombre,
//             telefono: usuarioCreado.telefono,
//             direccion: usuarioCreado.direccion,
//             email: usuarioCreado.email,
//             rol: usuarioCreado.rol,
//             foto: usuarioCreado.foto
//         };

//         // 1. RESPONDEMOS AL INSTANTE A LA APK -> Esto te manda a la pantalla de verificar
//         res.status(201).json({
//             message: 'Usuario registrado con éxito. Hemos enviado un codigo de 6 digitos a tu correo.',
//             emailEnviado: true,
//             usuarios: usuarioRespuesta
//         });

//         // 2. ENVIAMOS EL CORREO EN SEGUNDO PLANO (ya no bloquea la APK)
//         enviarCodigoVerificacion(email, nombre, codigoVerificacion)
//             .then(r => console.log(`Código a ${email}: ${r.exito ? 'enviado' : 'falló'}`))
//             .catch(e => console.error('Error envío verificación:', e));

//     } catch (error) {
//         console.error("error en el registro", error);
//         return res.status(500).json({
//             error: error.message
//         });
//     }
// };

// //crear el LOGIN
// export const login = async (req, res) => {
//     try {
//         const { nombre, email, password } = req.body;

//         if (!nombre || !email || !password) {
//             return res.status(400).json({
//                 error: 'Todos los campos son requeridos :nombre, email y contraseña'
//             });
//         }

//         const { data: usuarios } = await obtenerPorEmail(email);
//         if (!usuarios) {
//             return res.status(400).json({
//                 error: 'Crdenciales incorrectas'
//             });
//         }

//         if (!usuarios.password) {
//             return res.status(400).json({
//                 error: 'Esta cuenta usa Google. Inicia sesión con el botón de Google.'
//             });
//         }

//         const passwordValida = await bcrypt.compare(password, usuarios.password);
//         if (!passwordValida) {
//             return res.status(400).json({
//                 error: 'Crdenciales incorrectas'
//             });
//         }

//         if (!usuarios.isVerified) {
//             return res.status(403).json({
//                 error: 'Tu cuenta no ha sido verificada. Por favor ingrese el codigo enviado a tu correo antes de iniciar sesion.'
//             });
//         }

//         const token = jwt.sign(
//             {
//                 id_usuario: usuarios.id_usuario,
//                 nombre: usuarios.nombre,
//                 telefono: usuarios.telefono,
//                 direccion: usuarios.direccion,
//                 email: usuarios.email,
//                 rol: usuarios.rol
//             },
//             process.env.JWT_SECRET,
//             { expiresIn: '1h' }
//         );

//         return res.status(200).json({
//             message: 'Inicio de sesion exitoso',
//             token,
//             usuario: {
//                 id_usuario: usuarios.id_usuario,
//                 nombre: usuarios.nombre,
//                 telefono: usuarios.telefono,
//                 direccion: usuarios.direccion,
//                 email: usuarios.email,
//                 rol: usuarios.rol,
//                 foto: usuarios.foto || usuarios.avatar || null
//             }
//         });

//     } catch (error) {
//         console.error("Error en el login", error);
//         return res.status(500).json({
//             error: error.message
//         });
//     }
// };

// //verificar cuenta con codigo de 6 digitos
// export const verificarCuenta = async (req, res) => {
//     try {
//         const { email, codigoVerificacion } = req.body;

//         if (!email || !codigoVerificacion) {
//             return res.status(400).json({
//                 error: 'El Email y codigo de verificación son requeridos'
//             });
//         }

//         const { data: usuario, error: errorUsuario } = await supabase
//             .from('usuarios')
//             .select('id_usuario, nombre, telefono, direccion, email, rol, isVerified, codigoVerificacion, codigoVerificacionExpiracion')
//             .eq('email', email)
//             .single();

//         if (errorUsuario || !usuario) {
//             return res.status(404).json({
//                 error: 'Usuario no encontrado'
//             });
//         }

//         if (usuario.isVerified) {
//             return res.status(400).json({
//                 error: 'La cuenta ya se encuentra verificada'
//             });
//         }

//         if (String(usuario.codigoVerificacion).trim() !== String(codigoVerificacion).trim()) {
//             return res.status(400).json({
//                 error: 'Codigo de verificación es  incorrecto'
//             });
//         }

//         const ahora = new Date();
//         const expiracion = new Date(usuario.codigoVerificacionExpiracion);
//         if (ahora > expiracion) {
//             return res.status(400).json({
//                 error: 'El codigo  ha expirado. Por favor solicita un nuevo codigo.'
//             });
//         }

//         const { error: errorUpdate } = await supabase
//             .from('usuarios')
//             .update({
//                 isVerified: true,
//                 codigoVerificacion: null,
//                 codigoVerificacionExpiracion: null
//             })
//             .eq('id_usuario', usuario.id_usuario);

//         if (errorUpdate) {
//             return res.status(500).json({
//                 error: 'Error al actualizar el estado de verificación '
//             });
//         }

//         return res.status(200).json({
//             message: 'Cuenta verificada éxitosamente. Ahora puedes iniciar sesión en Papeleria Juan Jose.'
//         });

//     } catch (error) {
//         console.error("Error en verificarCuenta", error);
//         return res.status(500).json({
//             error: error.message
//         });
//     }
// };
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { supabase } from "../config/supabase.js";
import { crearUsuario, obtenerPorEmail } from "../models/user.js";
import { enviarCodigoVerificacion } from "../services/emailService.js";
import { subirFoto } from "../utils/subirFoto.js";

//registro
export const registro = async (req, res) => {
    try {
        // Se quitan los espacios sobrantes al inicio y al final (la contraseña no se toca)
        const nombre = String(req.body.nombre ?? '').trim();
        const telefono = String(req.body.telefono ?? '').trim();
        const direccion = String(req.body.direccion ?? '').trim();
        const email = String(req.body.email ?? '').trim();
        const { password } = req.body;

        if (!nombre || !telefono || !direccion || !password || !email) {
            return res.status(400).json({
                error: 'Todos los campos son requeridos : nombre, telefono, direccion, password y email'
            });
        }

        const { data: usuarioExiste } = await obtenerPorEmail(email);
        if (usuarioExiste) {
            return res.status(400).json({
                error: 'el email ya existe '
            });
        }

        const hashedpassword = await bcrypt.hash(password, 10);

        let fotoUrl = null;
        if (req.file) {
            try {
                fotoUrl = await subirFoto(req.file.buffer);
            } catch (e) {
                console.error("Error subiendo foto", e);
                return res.status(500).json({ error: 'No se pudo subir la foto' });
            }
        }

        const rolPorDefecto = 'usuario';
        const codigoVerificacion = Math.floor(100000 + Math.random() * 900000).toString();
        const codigoVerificacionExpiracion = new Date(Date.now() + 15 * 60 * 1000).toISOString();

        const { data, error } = await crearUsuario(
            nombre,
            telefono,
            email,
            direccion,
            hashedpassword,
            rolPorDefecto,
            codigoVerificacion,
            codigoVerificacionExpiracion,
            fotoUrl
        );
        if (error) {
            return res.status(500).json({
                error: "Error al crear el usuario en la base de datos"
            });
        }

        const usuarioCreado = Array.isArray(data) ? data[0] : data;

        const usuarioRespuesta = {
            id_usuario: usuarioCreado.id_usuario,
            nombre: usuarioCreado.nombre,
            telefono: usuarioCreado.telefono,
            direccion: usuarioCreado.direccion,
            email: usuarioCreado.email,
            rol: usuarioCreado.rol,
            foto: usuarioCreado.foto
        };

        // 1. RESPONDEMOS AL INSTANTE A LA APK -> Esto te manda a la pantalla de verificar
        res.status(201).json({
            message: 'Usuario registrado con éxito. Hemos enviado un codigo de 6 digitos a tu correo.',
            emailEnviado: true,
            usuarios: usuarioRespuesta
        });

        // 2. ENVIAMOS EL CORREO EN SEGUNDO PLANO (ya no bloquea la APK)
        enviarCodigoVerificacion(email, nombre, codigoVerificacion)
            .then(r => console.log(`Código a ${email}: ${r.exito ? 'enviado' : 'falló'}`))
            .catch(e => console.error('Error envío verificación:', e));

    } catch (error) {
        console.error("error en el registro", error);
        return res.status(500).json({
            error: error.message
        });
    }
};

//crear el LOGIN
export const login = async (req, res) => {
    try {
        const { nombre, email, password } = req.body;

        if (!nombre || !email || !password) {
            return res.status(400).json({
                error: 'Todos los campos son requeridos :nombre, email y contraseña'
            });
        }

        const { data: usuarios } = await obtenerPorEmail(email);
        if (!usuarios) {
            return res.status(400).json({
                error: 'Credenciales incorrectas'
            });
        }

        if (!usuarios.password) {
            return res.status(400).json({
                error: 'Esta cuenta usa Google. Inicia sesión con el botón de Google.'
            });
        }

        const passwordValida = await bcrypt.compare(password, usuarios.password);
        if (!passwordValida) {
            return res.status(400).json({
                error: 'Credenciales incorrectas'
            });
        }

        // El nombre debe ser EXACTAMENTE igual al guardado en la base de datos
        // (mayúsculas, tildes y espacios incluidos). Si el usuario lo cambió
        // en su perfil, aquí se compara con el nombre nuevo.
        if (String(nombre) !== String(usuarios.nombre)) {
            return res.status(400).json({
                error: 'Credenciales incorrectas'
            });
        }

        if (!usuarios.isVerified) {
            return res.status(403).json({
                error: 'Tu cuenta no ha sido verificada. Por favor ingrese el codigo enviado a tu correo antes de iniciar sesion.'
            });
        }

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
            { expiresIn: '1h' }
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
                rol: usuarios.rol,
                foto: usuarios.foto || usuarios.avatar || null
            }
        });

    } catch (error) {
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

        const { data: usuario, error: errorUsuario } = await supabase
            .from('usuarios')
            .select('id_usuario, nombre, telefono, direccion, email, rol, isVerified, codigoVerificacion, codigoVerificacionExpiracion')
            .eq('email', email)
            .single();

        if (errorUsuario || !usuario) {
            return res.status(404).json({
                error: 'Usuario no encontrado'
            });
        }

        if (usuario.isVerified) {
            return res.status(400).json({
                error: 'La cuenta ya se encuentra verificada'
            });
        }

        if (String(usuario.codigoVerificacion).trim() !== String(codigoVerificacion).trim()) {
            return res.status(400).json({
                error: 'Codigo de verificación es  incorrecto'
            });
        }

        const ahora = new Date();
        const expiracion = new Date(usuario.codigoVerificacionExpiracion);
        if (ahora > expiracion) {
            return res.status(400).json({
                error: 'El codigo  ha expirado. Por favor solicita un nuevo codigo.'
            });
        }

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



