/* =========================================================
   ETHEOS — LÓGICA DEL FRONTEND
   ========================================================= */
'use strict';

/* ---------- 1. MENÚ MÓVIL ---------- */
const botonMenu = document.getElementById('nav-toggle');
const listaMenu = document.getElementById('nav-lista');

function cambiarMenu(abrir) {
  listaMenu.classList.toggle('abierto', abrir);
  botonMenu.setAttribute('aria-expanded', String(abrir));
  botonMenu.setAttribute('aria-label', abrir ? 'Cerrar menú' : 'Abrir menú');
  botonMenu.textContent = abrir ? '✕' : '☰';
}

botonMenu.addEventListener('click', () => {
  cambiarMenu(!listaMenu.classList.contains('abierto'));
});

// Al tocar un enlace del menú, se cierra para no tapar la página
listaMenu.addEventListener('click', (e) => {
  if (e.target.closest('a')) cambiarMenu(false);
});


/* ---------- 2. LOGIN DEL ADMIN ---------- */
const ADMIN_USUARIO = 'paubacted';
const ADMIN_CLAVE = '1139123';
const CLAVE_SESION = 'etheosAdmin'; // sessionStorage: se borra al cerrar la pestaña

const formLogin = document.getElementById('form-login');
const mensajeLogin = document.getElementById('login-mensaje');
const panelAdmin = document.getElementById('panel-admin');

function mostrarMensajeLogin(texto, esError) {
  mensajeLogin.textContent = texto;
  mensajeLogin.classList.toggle('modal__mensaje--error', esError);
}

function abrirPanel() {
  panelAdmin.hidden = false;
}

function cerrarPanel() {
  panelAdmin.hidden = true;
}

formLogin.addEventListener('submit', (e) => {
  e.preventDefault();

  const usuario = document.getElementById('login-usuario').value.trim();
  const clave = document.getElementById('login-clave').value;
  const boton = formLogin.querySelector('button[type="submit"]');

  // Estado de carga: evita doble clic y le avisa a la persona que algo pasa
  boton.disabled = true;
  boton.textContent = 'Verificando...';
  mostrarMensajeLogin('', false);

  setTimeout(() => {
    boton.disabled = false;
    boton.textContent = 'Iniciar Sesión';

    if (usuario === ADMIN_USUARIO && clave === ADMIN_CLAVE) {
      sessionStorage.setItem(CLAVE_SESION, '1');
      mostrarMensajeLogin('Inicio de sesión completo ✓', false);
      setTimeout(() => {
        formLogin.reset();
        mostrarMensajeLogin('', false);
        abrirPanel();
        location.hash = 'panel-admin'; // también cierra el modal (:target)
      }, 700);
    } else {
      mostrarMensajeLogin('Usuario o contraseña incorrectos.', true);
      document.getElementById('login-clave').value = '';
    }
  }, 600);
});

document.getElementById('btn-salir').addEventListener('click', () => {
  sessionStorage.removeItem(CLAVE_SESION);
  cerrarPanel();
  location.hash = 'inicio';
});

// Si ya iniciaste sesión en esta pestaña, el panel sigue disponible al recargar
if (sessionStorage.getItem(CLAVE_SESION) === '1') {
  abrirPanel();
}


/* ---------- 3. PANEL: APROBAR / RECHAZAR ---------- */
const filasPanel = document.getElementById('panel-filas');
const avisoVacio = document.getElementById('panel-vacio');

function revisarSiHayFilas() {
  avisoVacio.hidden = filasPanel.children.length > 0;
}

// Un solo listener para todos los botones (delegación de eventos)
filasPanel.addEventListener('click', (e) => {
  const boton = e.target.closest('button[data-accion]');
  if (!boton) return;

  const fila = boton.closest('tr');

  if (boton.dataset.accion === 'aprobar') {
    // TEMPORAL: aquí iría un fetch() al backend para guardar la aprobación
    fila.classList.add('fila--aprobada');
    fila.querySelector('.panel__acciones').innerHTML =
      '<span class="estado">✓ Aprobado</span>';
  } else {
  
    fila.classList.add('fila--saliendo');
    setTimeout(() => {
      fila.remove();
      revisarSiHayFilas();
    }, 350); // coincide con la transición de .fila--saliendo
  }
});


/* ---------- 4. FORMULARIO "SUGIERE UN RECURSO" ---------- */
const formSugerencia = document.getElementById('form-sugerencia');
const estadoSugerencia = document.getElementById('sug-estado');

formSugerencia.addEventListener('submit', (e) => {
  e.preventDefault(); // evita que la página recargue

  const boton = formSugerencia.querySelector('button[type="submit"]');
  const primerNombre = document.getElementById('sug-nombre').value.trim().split(' ')[0];

  boton.disabled = true;
  boton.textContent = 'Enviando...';
  estadoSugerencia.textContent = '';
  estadoSugerencia.classList.remove('formulario__estado--error');

  setTimeout(() => {
    estadoSugerencia.textContent = `¡Gracias, ${primerNombre}! Recibimos tu sugerencia.`;
    formSugerencia.reset();
    boton.disabled = false;
    boton.textContent = 'Enviar sugerencia';
  }, 900);
});


/* ---------- 5. CHAT DEL GUARDIÁN ---------- */

const formChat = document.getElementById('chat-form');
const cajaChat = document.getElementById('chat-conversacion');
const inputChat = document.getElementById('chat-input');

function agregarMensaje(texto, clase) {
  const mensaje = document.createElement('div');
  mensaje.className = `chat__mensaje ${clase}`;
  mensaje.textContent = texto; // textContent evita inyectar HTML
  cajaChat.appendChild(mensaje);
  cajaChat.scrollTop = cajaChat.scrollHeight;
}

formChat.addEventListener('submit', (e) => {
  e.preventDefault();
  agregarMensaje(inputChat.value.trim(), 'chat__mensaje--usuario');
  agregarMensaje(
    'Excelente pregunta. Te recomiendo explorar el módulo relacionado en el catálogo y dedicarle tiempo de atención plena.',
    'chat__mensaje--ia'
  );
  inputChat.value = '';
});


/* ---------- 6. FAVORITOS (corazón en cada tarjeta) ---------- */
// Los favoritos son un ARREGLO con los ids de las pasiones, por ejemplo:
//   ['quimica', 'musica']
// Se guardan en localStorage, que es una "cajita" del navegador:
// sobrevive aunque cierres la página, pero solo en este navegador.
const CLAVE_FAVORITOS = 'etheosFavoritos';

// Lee la lista guardada. Si no hay nada (primera visita), devuelve un arreglo vacío.
function leerFavoritos() {
  try {
    // localStorage solo guarda TEXTO; JSON.parse lo convierte de vuelta en arreglo
    return JSON.parse(localStorage.getItem(CLAVE_FAVORITOS)) || [];
  } catch (error) {
    return []; // si el dato está dañado o el navegador bloquea el almacenamiento
  }
}

// Guarda la lista. JSON.stringify convierte el arreglo en texto para poder guardarlo.
function guardarFavoritos(lista) {
  try {
    localStorage.setItem(CLAVE_FAVORITOS, JSON.stringify(lista));
  } catch (error) {
    // si no se puede guardar, el corazón igual funciona durante esta visita
  }
}

let favoritos = leerFavoritos();

// Cambia cómo se ve el botón: ♥ si es favorito, ♡ si no.
// El CSS usa aria-pressed="true" para pintar el fondo vino.
function pintarCorazon(boton, esFavorito) {
  boton.setAttribute('aria-pressed', String(esFavorito));
  boton.textContent = esFavorito ? '♥' : '♡';
}

// Para CADA tarjeta del catálogo: crea su corazón y le da vida
document.querySelectorAll('.tarjeta').forEach((tarjeta) => {
  // El id de la tarjeta es 'tarjeta-quimica'; quitamos 'tarjeta-' y queda 'quimica'
  const id = tarjeta.id.replace('tarjeta-', '');
  const nombre = tarjeta.querySelector('.tarjeta__titulo').textContent;

  // Crear el botón (no está escrito en el HTML)
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = 'tarjeta__fav';
  boton.setAttribute('aria-label', `Marcar ${nombre} como favorita`);
  pintarCorazon(boton, favoritos.includes(id)); // ¿ya estaba guardada?

  // Al hacer clic: si ya es favorita se quita; si no, se agrega
  boton.addEventListener('click', () => {
    if (favoritos.includes(id)) {
      favoritos = favoritos.filter((f) => f !== id); // deja todos menos este
    } else {
      favoritos.push(id); // agrega este al final
    }
    guardarFavoritos(favoritos);
    pintarCorazon(boton, favoritos.includes(id));
  });

  tarjeta.appendChild(boton); // poner el botón dentro de la tarjeta
});