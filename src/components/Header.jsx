import { useState } from 'react';

export default function Header({ onAdmin }) {
  const [abierto, setAbierto] = useState(false); // menú hamburguesa en móvil
  const cerrar = () => setAbierto(false);

  return (
    <header className="header">
      <a href="#inicio" className="logo">HOME</a>
      <nav className="nav" aria-label="Navegación principal">
        <button type="button" className="nav__toggle" aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={abierto} aria-controls="nav-lista" onClick={() => setAbierto(!abierto)}>
          {abierto ? '✕' : '☰'}
        </button>
        <ul className={`nav__lista${abierto ? ' abierto' : ''}`} id="nav-lista">
          <li><a href="#inicio" className="nav__enlace" onClick={cerrar}>Inicio</a></li>
          <li><a href="#catalogo" className="nav__enlace" onClick={cerrar}>Catálogo</a></li>
          <li><a href="#contacto" className="nav__enlace" onClick={cerrar}>Contacto</a></li>
          <li><a href="#ia-guardian" className="nav__enlace" onClick={cerrar}>Guardián IA</a></li>
          <li>
            <button type="button" className="btn btn--admin" aria-label="Acceso administrador"
              onClick={() => { cerrar(); onAdmin(); }}>👑</button>
          </li>
        </ul>
      </nav>
    </header>
  );
}
