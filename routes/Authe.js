import express from 'express';
import { registro,login } from '../controllers/Auth.js';
import { forgotpassword, verifyCode } from '../controllers/recuperar.js';

const router = express.Router();

//RUTAS DE AUTENTICACION
router.post('/register', registro);
router.post('/login', login);
verifyCode
//ruta de olvido su cotraseña
router.post ('/forgot-password', forgotpassword);
router.post ('/verify-code', verifyCode);


export default router;