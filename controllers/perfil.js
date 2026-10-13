import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import { supabase } from "../config/supabase.js";

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

// Sube el archivo (que está en memoria) a Cloudinary
const subirACloudinary = (buffer) =>
    new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: 'perfiles', resource_type: 'image' },
            (error, result) => (error ? reject(error) : resolve(result))
        );
        stream.end(buffer);
    });

// Guarda la foto de perfil
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
        console.error("Error al subir foto", error);
        return res.status(500).json({ error: error.message });
    }
};