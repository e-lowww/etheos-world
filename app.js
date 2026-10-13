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
botonMenu.addEventListener('click', () => cambiarMenu(!listaMenu.classList.contains('abierto')));
listaMenu.addEventListener('click', (e) => { if (e.target.closest('a')) cambiarMenu(false); });

/* ---------- 2. LOGIN DEL ADMIN ---------- */
const ADMIN_USUARIO = 'paubacted';
const ADMIN_CLAVE = '1139123';
const CLAVE_SESION = 'etheosAdmin'; 
const formLogin = document.getElementById('form-login');
const mensajeLogin = document.getElementById('login-mensaje');
const panelAdmin = document.getElementById('panel-admin');
function mostrarMensajeLogin(texto, esError) {
  mensajeLogin.textContent = texto;
  mensajeLogin.classList.toggle('modal__mensaje--error', esError);
}
formLogin.addEventListener('submit', (e) => {
  e.preventDefault();
  const usuario = document.getElementById('login-usuario').value.trim();
  const clave = document.getElementById('login-clave').value;
  const boton = formLogin.querySelector('button[type="submit"]');
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
        panelAdmin.hidden = false;
        location.hash = 'panel-admin';
      }, 700);
    } else {
      mostrarMensajeLogin('Usuario o contraseña incorrectos.', true);
      document.getElementById('login-clave').value = '';
    }
  }, 600);
});
document.getElementById('btn-salir').addEventListener('click', () => {
  sessionStorage.removeItem(CLAVE_SESION);
  panelAdmin.hidden = true;
  location.hash = 'inicio';
});
if (sessionStorage.getItem(CLAVE_SESION) === '1') panelAdmin.hidden = false;

/* ---------- 3. PANEL: APROBAR / RECHAZAR ---------- */
const filasPanel = document.getElementById('panel-filas');
const avisoVacio = document.getElementById('panel-vacio');
filasPanel.addEventListener('click', (e) => {
  const boton = e.target.closest('button[data-accion]');
  if (!boton) return;
  const fila = boton.closest('tr');
  if (boton.dataset.accion === 'aprobar') {
    fila.classList.add('fila--aprobada');
    fila.querySelector('.panel__acciones').innerHTML = '<span class="estado">✓ Aprobado</span>';
  } else {
    fila.classList.add('fila--saliendo');
    setTimeout(() => {
      fila.remove();
      avisoVacio.hidden = filasPanel.children.length > 0;
    }, 350); 
  }
});

/* ---------- 4. FORMULARIO "SUGIERE UN RECURSO" (OPTIMIZADO) ---------- */
const formSugerencia = document.getElementById('form-sugerencia');
const estadoSugerencia = document.getElementById('sug-estado');

formSugerencia.addEventListener('submit', (e) => {
  e.preventDefault(); 
  const boton = formSugerencia.querySelector('button[type="submit"]');
  const nombreInput = document.getElementById('sug-nombre');
  const enlaceInput = document.getElementById('sug-enlace');
  estadoSugerencia.textContent = '';
  estadoSugerencia.classList.remove('formulario__estado--error');
  if (nombreInput.value.trim() === "" || enlaceInput.value.trim() === "") {
    estadoSugerencia.textContent = 'Por favor, completa los campos requeridos.';
    estadoSugerencia.classList.add('formulario__estado--error');
    return;
  }
  const primerNombre = nombreInput.value.trim().split(' ')[0];
  boton.disabled = true;
  boton.textContent = 'Enviando sugerencia...';
  nombreInput.disabled = true;
  enlaceInput.disabled = true;
  setTimeout(() => {
    estadoSugerencia.textContent = `¡Gracias, ${primerNombre}! Recibimos tu sugerencia correctamente.`;
    formSugerencia.reset();
    boton.disabled = false;
    boton.textContent = 'Enviar sugerencia';
    nombreInput.disabled = false;
    enlaceInput.disabled = false;
  }, 1200);
});

/* ---------- 5. CHAT DEL GUARDIÁN ---------- */
const formChat = document.getElementById('chat-form');
const cajaChat = document.getElementById('chat-conversacion');
const inputChat = document.getElementById('chat-input');
function agregarMensaje(texto, clase) {
  const mensaje = document.createElement('div');
  mensaje.className = `chat__mensaje ${clase}`;
  mensaje.textContent = texto; 
  cajaChat.appendChild(mensaje);
  cajaChat.scrollTop = cajaChat.scrollHeight;
}
formChat.addEventListener('submit', (e) => {
  e.preventDefault();
  agregarMensaje(inputChat.value.trim(), 'chat__mensaje--usuario');
  agregarMensaje('Excelente pregunta. Te recomiendo explorar el módulo relacionado en el catálogo y dedicarle tiempo de atención plena.', 'chat__mensaje--ia');
  inputChat.value = '';
});

/* ---------- 6. FAVORITOS (corazón en cada tarjeta) ---------- */
const CLAVE_FAVORITOS = 'etheosFavoritos';
function leerFavoritos() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_FAVORITOS)) || [];
  } catch (error) {
    return []; 
  }
}
function guardarFavoritos(lista) {
  try {
    localStorage.setItem(CLAVE_FAVORITOS, JSON.stringify(lista));
  } catch (error) {
  }
}
let favoritos = leerFavoritos();
function pintarCorazon(boton, esFavorito) {
  boton.setAttribute('aria-pressed', String(esFavorito));
  boton.textContent = esFavorito ? '♥' : '♡';
}
document.querySelectorAll('.tarjeta').forEach((tarjeta) => {
  const id = tarjeta.id.replace('tarjeta-', '');
  const nombre = tarjeta.querySelector('.tarjeta__titulo').textContent;
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = 'tarjeta__fav';
  boton.setAttribute('aria-label', `Marcar ${nombre} como favorita`);
  pintarCorazon(boton, favoritos.includes(id));
  boton.addEventListener('click', () => {
    favoritos = favoritos.includes(id) ? favoritos.filter((f) => f !== id) : [...favoritos, id];
    guardarFavoritos(favoritos);
    pintarCorazon(boton, favoritos.includes(id));
  });
  tarjeta.appendChild(boton);
});

/* ---------- 7. BUSCADOR DEL CATÁLOGO ---------- */
const inputBuscador = document.getElementById('buscador-input');
const botonLimpiar = document.getElementById('buscador-limpiar');
const sinResultados = document.getElementById('catalogo-vacio');
// Pasa a minúsculas y quita tildes: "Química", "QUIMICA" y "quimica" se leen igual
const normalizar = (texto) => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
// Por cada tarjeta guardamos su nombre, su categoría y los nombres de sus 4 recursos
const indice = [...document.querySelectorAll('.tarjeta')].map((tarjeta) => {
  const vista = document.getElementById('vista-' + tarjeta.id.replace('tarjeta-', ''));
  const nombres = [...vista.querySelectorAll('.recurso__texto small')].map((s) => s.textContent);
  const aviso = document.createElement('p'); // etiqueta amarilla "Incluye: ..."
  aviso.className = 'tarjeta__coincidencia';
  aviso.hidden = true;
  tarjeta.insertBefore(aviso, tarjeta.querySelector('.btn--plano'));
  const propio = tarjeta.querySelector('.tarjeta__titulo').textContent + ' ' + tarjeta.querySelector('.tarjeta__categoria').textContent;
  return { tarjeta, aviso, nombres, propio: normalizar(propio), recursos: nombres.map(normalizar) };
});
function buscar() {
  const palabras = normalizar(inputBuscador.value).split(' ').filter(Boolean);
  let visibles = 0;
  indice.forEach(({ tarjeta, aviso, nombres, propio, recursos }) => {
    // La tarjeta se queda si CADA palabra aparece en su nombre/categoría o en algún recurso
    const coincide = palabras.every((p) => propio.includes(p) || recursos.some((r) => r.includes(p)));
    const porNombre = palabras.every((p) => propio.includes(p));
    const hallados = nombres.filter((_, i) => palabras.some((p) => recursos[i].includes(p)));
    tarjeta.hidden = !coincide;
    aviso.hidden = !(coincide && !porNombre && hallados.length);
    aviso.textContent = 'Incluye: ' + hallados.join(' · ');
    if (coincide) visibles++;
  });
  sinResultados.hidden = visibles > 0;
  botonLimpiar.hidden = inputBuscador.value === '';
}
inputBuscador.addEventListener('input', buscar);
botonLimpiar.addEventListener('click', () => { inputBuscador.value = ''; buscar(); inputBuscador.focus(); });