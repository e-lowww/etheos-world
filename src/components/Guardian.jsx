import { useEffect, useRef, useState } from 'react';
import { API_URL } from '../api.js';

const SALUDO = 'Saludos cordiales. Soy el Guardián de Etheos, un asistente diseñado exclusivamente para acompañar su proceso de aprendizaje. Le invito a consultar sobre cualquiera de sus pasiones o disciplinas de interés; le orientaré hacia el conocimiento con absoluta calma, método y enfoque.';

export default function Guardian() {
  const [mensajes, setMensajes] = useState([{ de: 'ia', texto: SALUDO }]);
  const [texto, setTexto] = useState('');
  const [cargando, setCargando] = useState(false);
  const caja = useRef(null);
  const input = useRef(null);

  // Baja el chat al último mensaje cada vez que algo cambia
  useEffect(() => { caja.current.scrollTop = caja.current.scrollHeight; }, [mensajes, cargando]);

  async function enviar(e) {
    e.preventDefault();
    const pregunta = texto.trim();
    if (!pregunta) return;
    setMensajes((m) => [...m, { de: 'usuario', texto: pregunta }]);
    setTexto('');
    setCargando(true);
    let respuesta;
    try {
      const r = await fetch(`${API_URL}/api/guardian/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje: pregunta })
      });
      const resultado = await r.json();
      respuesta = resultado.respuesta || 'Disculpe la interrupción en nuestro canal de comunicación. ¿Podría plantearme su inquietud nuevamente?';
    } catch (error) {
      console.error('Error en la conexión del chat con el backend:', error);
      respuesta = 'En este momento no logro conectar con el templo del conocimiento. Por favor, inténtelo de nuevo en unos instantes.';
    }
    setMensajes((m) => [...m, { de: 'ia', texto: respuesta }]);
    setCargando(false);
    setTimeout(() => input.current?.focus(), 0);
  }

  return (
    <aside id="ia-guardian" className="guardian">
      <header className="seccion__cabecera">
        <p className="seccion__etiqueta">Asistente</p>
        <h2 className="seccion__titulo">GUARDIÁN DE ETHEOS</h2>
        <p className="chat__aviso">🔒 Por su privacidad, no escriba datos personales.</p>
      </header>
      <div className="guardian__grid">
        <figure className="guardian__figura">
          <img src="https://cdn-icons-png.flaticon.com/512/4712/4712109.png" alt="Robot inteligente, Guardián de Etheos" className="guardian__robot" />
        </figure>
        <div className="chat">
          <div className="chat__conversacion" ref={caja} aria-live="polite">
            {mensajes.map((m, i) => (
              <div key={i} className={`chat__mensaje chat__mensaje--${m.de}`}><p>{m.texto}</p></div>
            ))}
            {cargando && <div className="chat__mensaje chat__mensaje--ia">El Guardián está reflexionando en silencio...</div>}
          </div>
          <form className="chat__form" onSubmit={enviar}>
            <label htmlFor="chat-input" className="sr-only">Escribe tu pregunta</label>
            <input type="text" id="chat-input" ref={input} className="campo__input chat__input" required
              placeholder="Pregunta algo sobre lo que quieres saber..." value={texto} disabled={cargando}
              onChange={(e) => setTexto(e.target.value)} />
            <button type="submit" className="btn btn--amarillo" disabled={cargando}>Consultar</button>
          </form>
        </div>
      </div>
    </aside>
  );
}
