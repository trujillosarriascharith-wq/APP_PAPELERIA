import Groq from "groq-sdk";
import { supabase } from "../config/supabase.js"; // Ruta a tu cliente de Supabase existente

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const chatearConPapeleria = async (req, res) => {
  try {
    const { mensaje, sesionId, usuarioId } = req.body;

    if (!mensaje ||!mensaje.trim()) {
      return res.status(400).json({ message: "Debes enviar un mensaje." });
    }

    // Si el cliente no manda sesion, creamos un identificador temporal
    const idSesionValido = sesionId || `papeleria_sesion_${Date.now()}`;

    // 1. Obtener la carta desde tu tabla 'productos' en Supabase
    const { data: productos, error: errorProductos } = await supabase
     .from("productos")
     .select("nombre, descripcion, precio");

    if (errorProductos) {
      console.error("Error al consultar Supabase:", errorProductos.message);
      return res.status(500).json({ message: "Error al consultar productos." });
    }

    if (!productos || productos.length === 0) {
      return res.status(200).json({
        respuesta: "¡Hola! En este momento no tenemos productos registrados en la carta."
      });
    }

    // 2. Armar catalogo para la IA
    const catalogoTexto = productos.map(p =>
      `- **${p.nombre}**: $${Number(p.precio).toLocaleString("es-CO")} COP | Descripcion: ${p.descripcion}`
    ).join("\n");

    const systemPrompt = `
Eres el asesor virtual y anfitrion de la papeleria "Papeleria Juan Jose".
Eres alegre, amable, refrescante y educado.

CATALOGO ACTUAL EN TIENDA:
${catalogoTexto}

REGLAS DE ATENCION:
1. Si el cliente solo saluda (ej: "Hola", "¿Como estas?"), responde con cortesia y cercania sin dar la carta ni precios:
"¡Hola! Bienvenido a Papeleria Juan Jose 📝. Que alegria tenerte aqui, ¿que productos estas buscando el dia de hoy ?"
2. Da precios y nombre de los productos UNICAMENTE cuando el cliente pregunte por la carta o cuanto cuestan los productos.
3. Especifica los valores siempre en pesos colombianos ($ COP).
4. Se conciso y completa tus oraciones.
`;

    // 3. Inferencia con Groq
    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: mensaje }
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const respuestaTexto = completion.choices[0]?.message?.content || "No pude generar una respuesta.";

    // 4. Guardar ambos mensajes (pregunta y respuesta) en la tabla 'mensajes_chat' de Supabase
    const registrosAInsertar = [
      {
        sesion_id: idSesionValido,
        usuario_id: usuarioId || null,
        emisor: "user",
        mensaje: mensaje.trim()
      },
      {
        sesion_id: idSesionValido,
        usuario_id: usuarioId || null,
        emisor: "bot",
        mensaje: respuestaTexto
      }
    ];

    const { error: errorInsert } = await supabase
     .from("mensajes_chat")
     .insert(registrosAInsertar);

    if (errorInsert) {
      console.error("Error guardando el historial en Supabase:", errorInsert.message);
      // No frenamos la respuesta al cliente aunque falle el guardado en BD
    }

    return res.status(200).json({
      respuesta: respuestaTexto,
      sesionId: idSesionValido
    });

  } catch (error) {
    console.error("Error en Groq Chat Papeleria:", error);
    return res.status(500).json({
      message: "Error al procesar la respuesta",
      error: error.message
    });
  }
};

// Endpoint extra para recuperar la conversacion si el usuario vuelve a abrir la app
export const obtenerHistorialPapeleria = async (req, res) => {
  try {
    const { sesionId } = req.params;

    const { data: historial, error } = await supabase
     .from("mensajes_chat")
     .select("emisor, mensaje, created_at")
     .eq("sesion_id", sesionId)
     .order("created_at", { ascending: true });

    if (error) {
      return res.status(500).json({ message: "Error al consultar historial", error: error.message });
    }

    return res.status(200).json({ historial: historial || [] });
  } catch (error) {
    return res.status(500).json({ message: "Error interno", error: error.message });
  }
};