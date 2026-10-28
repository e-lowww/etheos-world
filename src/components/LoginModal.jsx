import { useState } from 'react';
import { API_URL, setToken } from '../api.js';

export default function LoginModal({ aviso, onCerrar, onExito }) {
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');
  const [mensaje, setMensaje] = useState({ texto: aviso, error: Boolean(aviso) });
  const [cargando, setCargando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setCargando(true);
    setMensaje({ texto: '', error: false });
    try {
      const respuesta = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario: usuario.trim(), clave })
      });
      const resultado = await respuesta.json();
      if (respuesta.ok && resultado.ok) {
        setToken(resultado.token);
        setMensaje({ texto: resultado.mensaje, error: false });
        setTimeout(onExito, 700);
      } else {
        setMensaje({ texto: resultado.mensaje || 'Usuario o contraseña incorrectos.', error: true });
        setClave('');
      }
    } catch (error) {
      console.error('Error conectando al login del backend:', error);
      setMensaje({ texto: 'No se pudo conectar con el servidor. Verifique que esté encendido.', error: true });
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="modal" role="dialog" aria-labelledby="login-titulo" aria-modal="true" style={{ display: 'flex' }}>
      <div className="modal__fondo" onClick={onCerrar} />
      <div className="modal__caja">
        <a href="#inicio" className="modal__cerrar" aria-label="Cerrar" onClick={(e) => { e.preventDefault(); onCerrar(); }}>✕</a>
        <div className="modal__icono" aria-hidden="true">✦</div>
        <h2 id="login-titulo" className="modal__titulo">Admin Login</h2>
        <p className="modal__subtitulo">Ingresa tus credenciales para aportar el conocimiento de la comunidad.</p>
        <form className="modal__form" onSubmit={enviar}>
          <label htmlFor="login-usuario" className="campo__label">Usuario</label>
          <input type="text" id="login-usuario" className="campo__input" placeholder="Tu usuario"
            autoComplete="username" required value={usuario} onChange={(e) => setUsuario(e.target.value)} />
          <label htmlFor="login-clave" className="campo__label">Contraseña</label>
          <input type="password" id="login-clave" className="campo__input" placeholder="••••••••"
            autoComplete="current-password" required value={clave} onChange={(e) => setClave(e.target.value)} />
          <button type="submit" className="btn btn--oscuro btn--ancho" disabled={cargando}>
            {cargando ? 'Verificando...' : 'Iniciar Sesión'}
          </button>
          <p className={`modal__mensaje${mensaje.error ? ' modal__mensaje--error' : ''}`} role="alert">{mensaje.texto}</p>
        </form>
      </div>
    </div>
  );
}
