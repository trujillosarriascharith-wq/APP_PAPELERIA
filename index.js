import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { conectaDB, supabase } from './config/supabase.js';
import AuthRoutes from './routes/Authe.js';
import UserRoutes from './routes/User.js';
import productoRouter from './routes/producto.js';
import pedidosRouter from './routes/pedido.js';
import carritoRoutes from './routes/carrito.js';
import categoriasRoutes from "./routes/categorias.js";

//cargar la variable 
dotenv.config();
conectaDB();

// creamos la aplacacion de express
const app = express();

//leer el json
app.use(express.json());
//habilitar cors
app.use(cors());

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
app.use('/api/productos', productoRouter);
app.use('/api', pedidosRouter);
app.use('/api/carrito', carritoRoutes);
app.use("/api/categorias", categoriasRoutes);



//configuramos el puerto 

const PORT = 3000;

//poner a escuchar el servidor 
 app.listen(PORT,() =>{
     conectaDB(); // Llama a la función para ver el mensaje en consola al iniciar
    console.log(`Servidor escuchando en el puerto ${PORT}`); // Corregido a backticks ``
    console.log(`http://localhost:${PORT}`);
 });
