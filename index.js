import express from 'express';
import dotenv from 'dotenv';
import { conectaDB, supabase } from './config/supabase.js';
import AuthRoutes from './routes/Authe.js';
import UserRoutes from './routes/User.js';

//cargar la variable 
dotenv.config();
conectaDB();

// creamos la aplacacion de express
const app = express();

//leer el json
app.use(express.json());

//creamos la ruta 

app.get('/',(req,res) =>{
    res.json({
        mensaje :"Bienvenido al backend de Papeleria Juan Jose",
        estado:"En linea ",
        version:"1.0.0"
    });
});

//ruta de autenticacion
app.use('/Auth', AuthRoutes);
app.use('/usuarios',UserRoutes);



//configuramos el puerto 

const PORT = 3000;

//poner a escuchar el servidor 
 app.listen(PORT,() =>{
     conectaDB(); // Llama a la función para ver el mensaje en consola al iniciar
    console.log(`Servidor escuchando en el puerto ${PORT}`); // Corregido a backticks ``
    console.log(`http://localhost:${PORT}`);
 });
