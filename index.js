require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { GoogleGenAI } = require('@google/genai');
const Sugerencia = require('./models/Sugerencias');

const OBLIGATORIAS = ['MONGODB_URI', 'GEMINI_API_KEY', 'ADMIN_USUARIO', 'ADMIN_CLAVE', 'JWT_SECRET'];
const faltantes = OBLIGATORIAS.filter((nombre) => !process.env[nombre]);
if (faltantes.length > 0) {
  console.error('✕ Faltan variables en el archivo .env:', faltantes.join(', '));
  process.exit(1);
}
const app = express();
const PORT = process.env.PORT || 3000;
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODELO_IA = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);
app.use(cors({ origin: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : true }));
app.use(express.json({ limit: '10kb' })); 
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✓ Conectado exitosamente a MongoDB Atlas'))
  .catch((error) => console.error('✕ Error conectando a MongoDB:', error));

/* =========================================================
   LÍMITES: frenan abusos (fuerza bruta en el login, gasto de la IA, spam)
   ========================================================= */
const limiteLogin = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false,
  message: { ok: false, mensaje: 'Demasiados intentos. Espere unos minutos e intente de nuevo.' }
});
const limiteChat = rateLimit({
  windowMs: 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false,
  message: { ok: false, respuesta: 'Le ruego un momento de calma: ha realizado demasiadas consultas seguidas.' }
});
const limiteSugerencias = rateLimit({
  windowMs: 60 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false,
  message: { ok: false, mensaje: 'Ha enviado demasiadas sugerencias. Intente de nuevo más tarde.' }
});
/* =========================================================
   LOGIN DEL ADMIN (devuelve un token) Y PROTECCIÓN DE RUTAS
   ========================================================= */
function iguales(a, b) {
  const hashA = crypto.createHash('sha256').update(String(a)).digest();
  const hashB = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}
app.post('/api/auth/login', limiteLogin, (req, res) => {
  const { usuario, clave } = req.body || {};
  const usuarioOk = iguales(usuario ?? '', process.env.ADMIN_USUARIO);
  const claveOk = iguales(clave ?? '', process.env.ADMIN_CLAVE);
  if (usuarioOk && claveOk) {
    const token = jwt.sign({ rol: 'admin' }, process.env.JWT_SECRET, { expiresIn: '2h' });
    return res.json({ ok: true, mensaje: 'Inicio de sesión completo ✓', token });
  }
  res.status(401).json({ ok: false, mensaje: 'Usuario o contraseña incorrectos.' });
});
function soloAdmin(req, res, next) {
  const cabecera = req.headers.authorization || '';
  const token = cabecera.startsWith('Bearer ') ? cabecera.slice(7) : '';
  try {
    jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    res.status(401).json({ ok: false, mensaje: 'Sesión no válida o expirada. Inicie sesión de nuevo.' });
  }
}
/* =========================================================
   SUGERENCIAS
   ========================================================= */
app.post('/api/sugerencias', limiteSugerencias, async (req, res) => {
  try {
    const { nombre, correo, categoria, enlace, justificacion } = req.body || {};
    await Sugerencia.create({ nombre, correo, categoria, enlace, justificacion });
    res.status(201).json({ ok: true, mensaje: '¡Sugerencia guardada!' });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const primerError = Object.values(error.errors)[0].message;
      return res.status(400).json({ ok: false, mensaje: primerError });
    }
    console.error('Error al guardar la sugerencia:', error);
    res.status(500).json({ ok: false, mensaje: 'Error en el servidor' });
  }
});
app.get('/api/admin/sugerencias', soloAdmin, async (req, res) => {
  try {
    const sugerencias = await Sugerencia.find({ estado: 'pendiente' }).sort({ fechaCreacion: -1 });
    res.json({ ok: true, sugerencias });
  } catch (error) {
    console.error('Error al obtener sugerencias:', error);
    res.status(500).json({ ok: false, mensaje: 'Error al leer la base de datos' });
  }
});
app.put('/api/admin/sugerencias/:id/aprobar', soloAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ ok: false, mensaje: 'Identificador no válido' });
    const sugerencia = await Sugerencia.findByIdAndUpdate(id, { estado: 'aprobado' });
    if (!sugerencia) return res.status(404).json({ ok: false, mensaje: 'La sugerencia no existe' });
    res.json({ ok: true, mensaje: 'Sugerencia aprobada exitosamente' });
  } catch (error) {
    console.error('Error al aprobar sugerencia:', error);
    res.status(500).json({ ok: false, mensaje: 'Error al actualizar en la base de datos' });
  }
});
app.delete('/api/admin/sugerencias/:id', soloAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ ok: false, mensaje: 'Identificador no válido' });
    const sugerencia = await Sugerencia.findByIdAndDelete(id);
    if (!sugerencia) return res.status(404).json({ ok: false, mensaje: 'La sugerencia no existe' });
    res.json({ ok: true, mensaje: 'Sugerencia eliminada permanentemente' });
  } catch (error) {
    console.error('Error al rechazar sugerencia:', error);
    res.status(500).json({ ok: false, mensaje: 'Error al borrar de la base de datos' });
  }
});

/* =========================================================
   GUARDIÁN IA (Gemini)
   ========================================================= */
const INSTRUCCION_GUARDIAN = `Eres el Guardián de Etheos, un refugio sereno de aprendizaje y crecimiento personal.
Háblale siempre de "usted", con un tono formal, sabio, empático y altamente pedagógico. Evita por completo el lenguaje coloquial.
Tu único objetivo es orientar, estructurar y motivar al usuario a aprender sobre sus pasiones, hobbies o habilidades.
Si te saluda, dale una bienvenida pacífica. Si pregunta algo sobre una disciplina o pasatiempo, explícalo con paciencia y claridad didáctica y fomenta el estudio constante.
Si pregunta algo ajeno al aprendizaje, redirígelo con cortesía hacia lo que Etheos ofrece.
Etheos tiene 16 pasiones: Química, Dibujo, Música, Poesía, Deportes, Historia, Astronomía, Programación, Fotografía, Literatura, Cocina, Idiomas, Biología, Filosofía, Cine y Arquitectura. Cada una abre un módulo con un video, un artículo, una serie y una sesión interactiva.
Cuando corresponda, recomienda el módulo de Etheos relacionado. No inventes enlaces ni recursos.
Responde de forma concisa pero enriquecedora.`;
app.post('/api/guardian/chat', limiteChat, async (req, res) => {
  try {
    const mensaje = String(req.body?.mensaje || '').trim();
    if (!mensaje) {
      return res.status(400).json({ ok: false, respuesta: 'El mensaje no puede estar vacío.' });
    }
    if (mensaje.length > 500) {
      return res.status(400).json({ ok: false, respuesta: 'Su mensaje es demasiado extenso. Le ruego resumirlo en menos de 500 caracteres.' });
    }
    const resultado = await ai.models.generateContent({
      model: MODELO_IA,
      contents: mensaje,
      config: { systemInstruction: INSTRUCCION_GUARDIAN }
    });
    res.json({ ok: true, respuesta: resultado.text });
  } catch (error) {
    console.error('Error en el endpoint del chat de la IA:', error);
    const saturado = error?.status === 429;
    res.status(500).json({
      ok: false,
      respuesta: saturado
        ? 'El Guardián recibe demasiadas consultas en este instante. Le ruego intentar de nuevo en unos minutos.'
        : 'El Guardián se encuentra meditando en este instante. Por favor, intente plantear su duda de nuevo en unos momentos.'
    });
  }
});
app.get('/api/prueba', (req, res) => {
  res.json({ mensaje: 'El servidor de Etheos está vivo y escuchando' });
});
app.listen(PORT, () => {
  console.log(`✓ Servidor corriendo en el puerto ${PORT}`);
});