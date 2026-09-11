import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { conectaDB, supabase } from './config/supabase.js';
import AuthRoutes from './routes/Authe.js';
import UserRoutes from './routes/User.js';
import productoRouter from './routes/producto.js';
import pedidoRoutes from './routes/pedido.js';
import carritoRoutes from './routes/carrito.js';
import categoriasRoutes from "./routes/categorias.js";
import pagosRoutes from "./routes/pagos.js"
import chatRoutes from "./routes/chatRoutes.js"; // Importa las rutas de chat
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
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/carrito', carritoRoutes);
app.use("/api/categorias", categoriasRoutes);
app.use("/api/pagos", pagosRoutes);
app.use("/api/chat", chatRoutes); // Agrega las rutas de chat


//configuramos el puerto 

const PORT = process.env.PORT || 3000;


//poner a escuchar el servidor 
 app.listen(PORT,() =>{
     conectaDB(); // Llama a la función para ver el mensaje en consola al iniciar
    console.log(`Servidor escuchando en el puerto ${PORT}`); // Corregido a backticks ``
    console.log(`http://localhost:${PORT}`);
    console.log(` Servidor corriendo en http://localhost:${PORT}`);

 });
