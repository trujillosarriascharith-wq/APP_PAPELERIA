// import express from 'express';
// import multer from 'multer';
// import path from 'path';
// import { verificarToken, subirFoto } from '../controllers/perfil.js';

// const router = express.Router();

// const upload = multer({
//     storage: multer.memoryStorage(),
//     limits: { fileSize: 5 * 1024 * 1024 }, // máximo 5 MB
//     fileFilter: (req, file, cb) => {
//         const ext = path.extname(file.originalname).toLowerCase();
//         const permitidas = ['.jpg', '.jpeg', '.png', '.webp'];
//         if (permitidas.includes(ext)) cb(null, true);
//         else cb(new Error('Solo se permiten imágenes jpg, png o webp'));
//     }
// });

// // POST /api/perfil/foto
// router.post('/foto', verificarToken, upload.single('foto'), subirFoto);

// export default router;
import express from 'express';
import multer from 'multer';
import path from 'path';
import {
    verificarToken,
    obtenerPerfil,
    actualizarPerfil,
    verificarCorreoNuevo,
    reenviarCodigoCorreo,
    subirFoto
} from '../controllers/perfil.js';

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // máximo 5 MB
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const permitidas = ['.jpg', '.jpeg', '.png', '.webp'];
        if (permitidas.includes(ext)) cb(null, true);
        else cb(new Error('Solo se permiten imágenes jpg, png o webp'));
    }
});

// Recibe la foto y devuelve un error en JSON si el archivo no sirve
const recibirFoto = (req, res, next) => {
    upload.single('foto')(req, res, (err) => {
        if (err) {
            const mensaje = err.code === 'LIMIT_FILE_SIZE'
                ? 'La imagen supera los 5 MB'
                : err.message;
            return res.status(400).json({ error: mensaje });
        }
        next();
    });
};

// GET  /api/perfil                  -> datos actuales del usuario
router.get('/', verificarToken, obtenerPerfil);

// PUT  /api/perfil                  -> guarda nombre, email (pendiente), dirección y teléfono
router.put('/', verificarToken, actualizarPerfil);

// POST /api/perfil/verificar-email  -> confirma el correo nuevo con el código
router.post('/verificar-email', verificarToken, verificarCorreoNuevo);

// POST /api/perfil/reenviar-codigo  -> envía un código nuevo al correo pendiente
router.post('/reenviar-codigo', verificarToken, reenviarCodigoCorreo);

// POST /api/perfil/foto             -> sube la foto de perfil
router.post('/foto', verificarToken, recibirFoto, subirFoto);

export default router;