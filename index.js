const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenAI } = require('@google/generative-ai');
const Sugerencia = require('./models/Sugerencias');
const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors()); 
app.use(express.json()); 

// Conexión real a la nube de MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✓ Conectado exitosamente a MongoDB Atlas'))
  .catch((error) => console.error('✕ Error conectando a MongoDB:', error));

/* =========================================================
   ENDPOINTS / RUTAS DE LA API (Express)
   ========================================================= */

// RUTA DE LOGIN SEGURO 
app.post('/api/auth/login', (req, res) => {
  try {
    const { usuario, clave } = req.body;
    const ADMIN_USUARIO = 'paubacted';
    const ADMIN_CLAVE = '1139123';

    if (usuario === ADMIN_USUARIO && clave === ADMIN_CLAVE) {
      return res.json({ 
        ok: true, 
        mensaje: 'Inicio de sesión completo ✓' 
      });
    } else {
      return res.status(401).json({ 
        ok: false, 
        mensaje: 'Usuario o contraseña incorrectos.' 
      });
    }
  } catch (error) {
    console.error('Error en el login seguro:', error);
    res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
  }
});

// 1. RUTA PARA RECIBIR Y GUARDAR LAS SUGERENCIAS DEL FORMULARIO
app.post('/api/sugerencias', async (req, res) => {
  try {
    const { nombre, correo, categoria, enlace, justificacion } = req.body;
    const nuevaSugerencia = new Sugerencia({
      nombre,
      correo,
      categoria,
      enlace,
      justificacion
    });
    await nuevaSugerencia.save();
    res.status(201).json({ 
      ok: true, 
      mensaje: '¡Sugerencia guardada en MongoDB Atlas!' 
    });
  } catch (error) {
    console.error('Error al guardar:', error);
    res.status(500).json({ ok: false, mensaje: 'Error en el servidor' });
  }
});

// 2. OBTENER LAS SUGERENCIAS PENDIENTES
app.get('/api/admin/sugerencias', async (req, res) => {
  try {
    const sugerenciasPendientes = await Sugerencia.find({ estado: 'pendiente' }).sort({ fechaCreacion: -1 });
    res.json({
      ok: true,
      sugerencias: sugerenciasPendientes
    });
  } catch (error) {
    console.error('Error al obtener sugerencias:', error);
    res.status(500).json({ ok: false, mensaje: 'Error al leer la base de datos' });
  }
});

// 3. APROBAR UNA SUGERENCIA 
app.put('/api/admin/sugerencias/:id/aprobar', async (req, res) => {
  try {
    const { id } = req.params;
    await Sugerencia.findByIdAndUpdate(id, { estado: 'aprobado' });
    res.json({ ok: true, mensaje: 'Sugerencia aprobada exitosamente' });
  } catch (error) {
    console.error('Error al aprobar sugerencia:', error);
    res.status(500).json({ ok: false, mensaje: 'Error al actualizar en la base de datos' });
  }
});

// 4. RECHAZAR UNA SUGERENCIA 
app.delete('/api/admin/sugerencias/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Sugerencia.findByIdAndDelete(id);
    res.json({ ok: true, mensaje: 'Sugerencia eliminada permanentemente' });
  } catch (error) {
    console.error('Error al rechazar sugerencia:', error);
    res.status(500).json({ ok: false, mensaje: 'Error al borrar de la base de datos' });
  }
});

// 5. CHAT DEL GUARDIÁN IA (CONEXIÓN CON GEMINI)
app.post('/api/guardian/chat', async (req, res) => {
  try {
    const { mensaje } = req.body;

    if (!mensaje) {
      return res.status(400).json({ ok: false, respuesta: 'El mensaje no puede estar vacío.' });
    }
    
    // Inicializamos Gemini de forma limpia
    const modelo = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
    // Instrucción estricta de personalidad (Formal, místico, pedagógico y enfocado en aprender)
    const promptConfig = `
      Eres el Guardián de Etheos World, un refugio sereno de aprendizaje y crecimiento personal.
      Tu tono debe ser SIEMPRE formal, sabio, empático y altamente pedagógico. 
      Háblale al usuario de "usted". Evita por completo modismos informales o lenguaje coloquial.
      Tu único objetivo es orientar, estructurar y motivar al usuario a aprender sobre sus pasiones, hobbies o habilidades.
      Si te saluda, dale una bienvenida pacífica. Si te hace una pregunta sobre cualquier disciplina académica o pasatiempo, explícaselo con paciencia, claridad didáctica y fomenta el estudio constante.
      Responde de forma concisa pero enriquecedora.
      
      Pregunta del usuario: "${mensaje}"
    `;
    const resultado = await modelo.generateContent(promptConfig);
    const respuestaIA = resultado.response.text();
    res.json({
      ok: true,
      respuesta: respuestaIA
    });
  } catch (error) {
    console.error('Error en el endpoint del chat de la IA:', error);
    res.status(500).json({ 
      ok: false, 
      respuesta: 'El Guardián se encuentra meditando en este instante. Por favor, intente conectar con su respiración y plantee su duda de nuevo en unos momentos.' 
    });
  }
});
app.get('/api/prueba', (req, res) => {
  res.json({ mensaje: "El servidor de Etheos está vivo y escuchando" });
});

app.listen(PORT, () => {
  console.log(`✓ Servidor corriendo en el puerto ${PORT}`);
});