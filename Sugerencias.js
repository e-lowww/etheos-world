const mongoose = require('mongoose');

const SugerenciaSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true
  },
  correo: {
    type: String,
    required: [true, 'El correo es obligatorio'],
    trim: true,
    lowercase: true
  },
  categoria: {
    type: String,
    required: [true, 'La categoría o hobby es obligatoria'],
    trim: true
  },
  enlace: {
    type: String,
    required: [true, 'El enlace del recurso es obligatorio'],
    trim: true
  },
  justificacion: {
    type: String,
    trim: true
  },
  estado: {
    type: String,
    enum: ['pendiente', 'aprobado'],
    default: 'pendiente' // Por defecto entra al panel para revisión del admin
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Sugerencia', SugerenciaSchema);