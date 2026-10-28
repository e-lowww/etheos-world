import { useState } from 'react';
import { API_URL } from '../api.js';
import { PASIONES } from '../data/pasiones.js';

const VACIO = { nombre: '', correo: '', categoria: '', enlace: '', justificacion: '' };

export default function Contacto() {
  const [datos, setDatos] = useState(VACIO);
  const [estado, setEstado] = useState({ texto: '', error: false });
  const [enviando, setEnviando] = useState(false);

  // Un solo manejador para todos los campos: usa el atributo name de cada input
  const cambiar = (e) => setDatos({ ...datos, [e.target.name]: e.target.value });

  async function enviar(e) {
    e.preventDefault();
    setEnviando(true);
    setEstado({ texto: '', error: false });
    const sugerencia = Object.fromEntries(Object.entries(datos).map(([k, v]) => [k, v.trim()]));
    try {
      const respuesta = await fetch(`${API_URL}/api/sugerencias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sugerencia)
      });
      const resultado = await respuesta.json();
      if (respuesta.ok && resultado.ok) {
        setEstado({ texto: `¡Gracias, ${sugerencia.nombre.split(' ')[0]}! Tu sugerencia fue recibida y será revisada.`, error: false });
        setDatos(VACIO);
      } else {
        setEstado({ texto: resultado.mensaje || 'Hubo un problema al guardar la sugerencia.', error: true });
      }
    } catch (error) {
      console.error('Error en la petición fetch:', error);
      setEstado({ texto: 'No se pudo conectar con el servidor. Inténtalo de nuevo en unos momentos.', error: true });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section id="contacto" className="contacto">
      <header className="seccion__cabecera">
        <p className="seccion__etiqueta">Comunidad</p>
        <h2 className="seccion__titulo">SUGIERE UN RECURSO</h2>
        <p className="seccion__texto">Acceso libre, sin registro. Ayúdanos a ofrecer el mejor conocimiento.</p>
      </header>
      <form className="formulario" onSubmit={enviar}>
        <fieldset className="formulario__fieldset">
          <legend className="formulario__legend">Tu recomendación</legend>
          <div className="campo">
            <label htmlFor="sug-nombre" className="campo__label">Tu Nombre Completo</label>
            <input type="text" id="sug-nombre" name="nombre" className="campo__input" placeholder="Ej: Khan Beirghstenbar"
              required value={datos.nombre} onChange={cambiar} />
          </div>
          <div className="campo">
            <label htmlFor="sug-correo" className="campo__label">Tu Correo Electrónico</label>
            <input type="email" id="sug-correo" name="correo" className="campo__input" placeholder="tucorreo@ejemplo.com"
              required value={datos.correo} onChange={cambiar} />
          </div>
          <div className="campo">
            <label htmlFor="sug-categoria" className="campo__label">Categoría del Hobby</label>
            <select id="sug-categoria" name="categoria" className="campo__input campo__select" required
              value={datos.categoria} onChange={cambiar}>
              <option value="" disabled>Selecciona una categoría</option>
              {PASIONES.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          <div className="campo">
            <label htmlFor="sug-enlace" className="campo__label">Enlace del recurso que quieres recomendar</label>
            <input type="url" id="sug-enlace" name="enlace" className="campo__input" placeholder="https://..."
              required value={datos.enlace} onChange={cambiar} />
          </div>
          <div className="campo">
            <label htmlFor="sug-justificacion" className="campo__label">¿Por qué quieres recomendar este contenido?</label>
            <textarea id="sug-justificacion" name="justificacion" className="campo__input campo__textarea"
              placeholder="Escribe tus motivos aquí..." value={datos.justificacion} onChange={cambiar} />
          </div>
          <button type="submit" className="btn btn--vino btn--ancho" disabled={enviando}>
            {enviando ? 'Enviando sugerencia...' : 'Enviar sugerencia'}
          </button>
          <p className={`formulario__estado${estado.error ? ' formulario__estado--error' : ''}`} role="status">{estado.texto}</p>
        </fieldset>
      </form>
    </section>
  );
}
