// import 'dotenv/config';
// import { v2 as cloudinary } from 'cloudinary';

// if (process.env.CLOUDINARY_CLOUD_NAME) {
//   cloudinary.config({
//     cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//     api_key: process.env.CLOUDINARY_API_KEY,
//     api_secret: process.env.CLOUDINARY_API_SECRET,
//   });
// }

// // Sube una imagen (buffer) a Cloudinary y devuelve la URL
// export const subirFoto = (buffer) =>
//   new Promise((resolve, reject) => {
//     const stream = cloudinary.uploader.upload_stream(
//       { folder: 'papeleria/usuarios', resource_type: 'image' },
//       (error, result) => (error ? reject(error) : resolve(result.secure_url))
//     );
//     stream.end(buffer);
//   });
import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';

if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Sube una imagen (buffer) a Cloudinary y devuelve la URL.
// Por defecto usa la carpeta de usuarios; para productos se pasa otra carpeta.
export const subirFoto = (buffer, carpeta = 'papeleria/usuarios') =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: carpeta, resource_type: 'image' },
      (error, result) => (error ? reject(error) : resolve(result.secure_url))
    );
    stream.end(buffer);
  });