const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
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
// 2. OBTENER LAS SUGERENCIAS PENDIENTES (Para el panel del Admin)
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
// 3. APROBAR UNA SUGERENCIA (Cambia su estado en la Base de Datos)
app.put('/api/admin/sugerencias/:id/aprobar', async (req, res) => {
  try {
    const { id } = req.params;
    // Cambiamos el estado a 'aprobado' en MongoDB
    await Sugerencia.findByIdAndUpdate(id, { estado: 'aprobado' });
    res.json({ ok: true, mensaje: 'Sugerencia aprobada exitosamente' });
  } catch (error) {
    console.error('Error al aprobar sugerencia:', error);
    res.status(500).json({ ok: false, mensaje: 'Error al actualizar en la base de datos' });
  }
});
// 4. RECHAZAR UNA SUGERENCIA (Elimina el documento de la Base de Datos)
app.delete('/api/admin/sugerencias/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Borramos por completo el registro de MongoDB usando su ID
    await Sugerencia.findByIdAndDelete(id);
    res.json({ ok: true, mensaje: 'Sugerencia eliminada permanentemente' });
  } catch (error) {
    console.error('Error al rechazar sugerencia:', error);
    res.status(500).json({ ok: false, mensaje: 'Error al borrar de la base de datos' });
  }
});
// Ruta rápida para probar en el navegador que el servidor funcione
app.get('/api/prueba', (req, res) => {
  res.json({ mensaje: "El servidor de Etheos está vivo y escuchando" });
});
// Encendemos el motor del servidor
app.listen(PORT, () => {
  console.log(`✓ Servidor corriendo en el puerto ${PORT}`);
});