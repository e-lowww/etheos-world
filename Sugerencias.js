const mongoose = require('mongoose');
const CATEGORIAS = [
  'quimica', 'dibujo', 'musica', 'poesia', 'deportes', 'historia', 'astronomia', 'programacion',
  'fotografia', 'literatura', 'cocina', 'idiomas', 'biologia', 'filosofia', 'cine', 'arquitectura'
];
function enlaceValido(texto) {
  try {
    const url = new URL(texto);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (error) {
    return false;
  }
}
const SugerenciaSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true,
    maxlength: [100, 'El nombre es demasiado largo']
  },
  correo: {
    type: String,
    required: [true, 'El correo es obligatorio'],
    trim: true,
    lowercase: true,
    maxlength: [150, 'El correo es demasiado largo'],
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'El correo no es válido']
  },
  categoria: {
    type: String,
    required: [true, 'La categoría o hobby es obligatoria'],
    trim: true,
    enum: { values: CATEGORIAS, message: 'La categoría no es válida' }
  },
  enlace: {
    type: String,
    required: [true, 'El enlace del recurso es obligatorio'],
    trim: true,
    maxlength: [500, 'El enlace es demasiado largo'],
    validate: { validator: enlaceValido, message: 'El enlace debe empezar por http:// o https://' }
  },
  justificacion: {
    type: String,
    trim: true,
    maxlength: [1000, 'La justificación es demasiado larga']
  },
  estado: {
    type: String,
    enum: ['pendiente', 'aprobado'],
    default: 'pendiente' 
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  }
});
module.exports = mongoose.model('Sugerencia', SugerenciaSchema);