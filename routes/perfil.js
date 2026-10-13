import express from 'express';
import multer from 'multer';
import path from 'path';
import { verificarToken, subirFoto } from '../controllers/perfil.js';

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

// POST /api/perfil/foto
router.post('/foto', verificarToken, upload.single('foto'), subirFoto);

export default router;