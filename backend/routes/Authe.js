import express from 'express';
import { registro,login , verificarCuenta} from '../controllers/Auth.js';
import { forgotpassword, verifyCode } from '../controllers/recuperar.js';
import { autenticarConGoogle } from '../controllers/googleauth.controller.js';
import { subirImagen } from '../middlewares/subirImagen.js';
const router = express.Router();

//RUTAS DE AUTENTICACION
// router.post('/register', registro);
router.post('/register', subirImagen.single('foto'), registro);
router.post('/login', login);
router.post('/verify-account', verificarCuenta); //ruta de verificacion de cuenta
//Endpoint: POS /api/auth/google
router.post("/google", autenticarConGoogle);


//ruta de olvido su cotraseña

router.post ('/forgot-password', forgotpassword);
router.post ('/verify-code', verifyCode);


export default router;
