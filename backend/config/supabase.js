//variables de entorno 
import dotenv from 'dotenv/config';
import {createClient}  from '@supabase/supabase-js';

////creacion de la conexion a superbase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

//Variables de conexion
if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Error: La variables de entorno SUPABASE_URL y SUPABASE_KEY son requeridas");
    process.exit(1);

}

//conexion a supabase 
export const supabase = createClient(supabaseUrl,supabaseKey );

export const conectaDB = () => {
    console.log("✅ Conexión a Supabase establecida correctamente");
};