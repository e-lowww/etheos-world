require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const modelo = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
console.log('Probando Gemini con el modelo:', modelo);
if (!process.env.GEMINI_API_KEY) {
  console.error('✕ No encuentro GEMINI_API_KEY. Revisa que el archivo .env esté dentro de la carpeta backend.');
  process.exit(1);
}
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function probar() {
  try {
    const resultado = await ai.models.generateContent({
      model: modelo,
      contents: 'Salúdame en una sola frase, con tono formal.'
    });
    console.log('✓ Gemini respondió:', resultado.text);
  } catch (error) {
    console.error('✕ Error:', error.message);
  }
}
probar();