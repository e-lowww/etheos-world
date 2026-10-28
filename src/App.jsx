import { useState } from 'react';
import Header from './components/Header.jsx';
import LoginModal from './components/LoginModal.jsx';
import Hero from './components/Hero.jsx';
import Catalogo from './components/Catalogo.jsx';
import Contacto from './components/Contacto.jsx';
import PanelAdmin from './components/PanelAdmin.jsx';
import Guardian from './components/Guardian.jsx';
import Footer from './components/Footer.jsx';
import { getToken, quitarToken } from './api.js';

const irA = (id) => setTimeout(() => document.getElementById(id)?.scrollIntoView(), 50);

export default function App() {
  const [loginAbierto, setLoginAbierto] = useState(false);
  const [avisoLogin, setAvisoLogin] = useState('');
  const [admin, setAdmin] = useState(Boolean(getToken())); // ¿hay sesión de admin?

  function abrirAdmin() {
    if (admin) irA('panel-admin');
    else setLoginAbierto(true);
  }
  function loginExitoso() {
    setAdmin(true);
    setLoginAbierto(false);
    irA('panel-admin');
  }
  function cerrarSesion(expirada = false) {
    quitarToken();
    setAdmin(false);
    if (expirada) {
      setAvisoLogin('Su sesión expiró. Inicie sesión de nuevo.');
      setLoginAbierto(true);
    } else {
      irA('inicio');
    }
  }

  return (
    <>
      <Header onAdmin={abrirAdmin} />
      {loginAbierto && (
        <LoginModal aviso={avisoLogin} onCerrar={() => { setLoginAbierto(false); setAvisoLogin(''); }} onExito={loginExitoso} />
      )}
      <main>
        <Hero />
        <Catalogo />
        <Contacto />
        {admin && <PanelAdmin onSalir={() => cerrarSesion(false)} onExpirada={() => cerrarSesion(true)} />}
        <Guardian />
      </main>
      <Footer />
    </>
  );
}
