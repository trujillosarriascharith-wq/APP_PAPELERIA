import multer from 'multer';

// La foto se queda en memoria y de ahí se sube a Cloudinary
export const subirImagen = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});