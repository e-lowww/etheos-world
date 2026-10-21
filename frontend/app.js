/* =========================================================
   ETHEOS — LÓGICA DEL FRONTEND
   ========================================================= */

'use strict';
const API_URL = 'http://localhost:3000';

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
const CLAVE_TOKEN = 'etheosToken';
const formLogin = document.getElementById('form-login');
const mensajeLogin = document.getElementById('login-mensaje');
const panelAdmin = document.getElementById('panel-admin');
const filasPanel = document.getElementById('panel-filas');
const avisoPanel = document.getElementById('panel-vacio');
function mostrarMensajeLogin(texto, esError) {
  mensajeLogin.textContent = texto;
  mensajeLogin.classList.toggle('modal__mensaje--error', esError);
}
function cerrarSesion(mensaje) {
  sessionStorage.removeItem(CLAVE_TOKEN);
  panelAdmin.hidden = true;
  filasPanel.replaceChildren();
  if (mensaje) {
    mostrarMensajeLogin(mensaje, true);
    location.hash = 'login';
  } else {
    location.hash = 'inicio';
  }
}
async function peticionAdmin(ruta, opciones = {}) {
  const token = sessionStorage.getItem(CLAVE_TOKEN);
  const respuesta = await fetch(`${API_URL}${ruta}`, {
    ...opciones,
    headers: { ...(opciones.headers || {}), Authorization: `Bearer ${token}` }
  });
  if (respuesta.status === 401) {
    cerrarSesion('Su sesión expiró. Inicie sesión de nuevo.');
    throw new Error('Sesión expirada');
  }
  return respuesta.json();
}
formLogin.addEventListener('submit', async (e) => {
  e.preventDefault();
  const usuario = document.getElementById('login-usuario').value.trim();
  const clave = document.getElementById('login-clave').value;
  const boton = formLogin.querySelector('button[type="submit"]');
  boton.disabled = true;
  boton.textContent = 'Verificando...';
  mostrarMensajeLogin('', false);
  try {
    const respuesta = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, clave })
    });
    const resultado = await respuesta.json();
    if (respuesta.ok && resultado.ok) {
      sessionStorage.setItem(CLAVE_TOKEN, resultado.token);
      mostrarMensajeLogin(resultado.mensaje, false);
      cargarSugerenciasAdmin();
      setTimeout(() => {
        formLogin.reset();
        mostrarMensajeLogin('', false);
        panelAdmin.hidden = false;
        location.hash = 'panel-admin';
      }, 700);
    } else {
      mostrarMensajeLogin(resultado.mensaje || 'Usuario o contraseña incorrectos.', true);
      document.getElementById('login-clave').value = '';
    }
  } catch (error) {
    console.error('Error conectando al login del backend:', error);
    mostrarMensajeLogin('No se pudo conectar con el servidor. Verifique que esté encendido.', true);
  } finally {
    boton.disabled = false;
    boton.textContent = 'Iniciar Sesión';
  }
});
document.getElementById('btn-salir').addEventListener('click', () => cerrarSesion());
if (sessionStorage.getItem(CLAVE_TOKEN)) {
  panelAdmin.hidden = false;
  cargarSugerenciasAdmin();
}
/* ---------- 3. PANEL: LISTAR, APROBAR Y RECHAZAR ---------- */
function mostrarAvisoPanel(texto) {
  avisoPanel.textContent = texto;
  avisoPanel.hidden = false;
}
function crearBoton(accion, texto, claseColor) {
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = `btn ${claseColor}`;
  boton.dataset.accion = accion;
  boton.textContent = texto;
  return boton;
}
function crearFila(sug) {
  const tr = document.createElement('tr');
  tr.dataset.id = sug._id;
  const tdNombre = document.createElement('td');
  const nombre = document.createElement('strong');
  nombre.textContent = sug.nombre;
  const correo = document.createElement('small');
  correo.textContent = sug.correo;
  tdNombre.append(nombre, document.createElement('br'), correo);
  const tdCategoria = document.createElement('td');
  const etiqueta = document.createElement('span');
  etiqueta.className = 'etiqueta';
  etiqueta.textContent = sug.categoria;
  tdCategoria.append(etiqueta);
  const tdEnlace = document.createElement('td');
  if (/^https?:\/\//i.test(sug.enlace)) { 
    const enlace = document.createElement('a');
    enlace.className = 'panel__link';
    enlace.href = sug.enlace;
    enlace.target = '_blank';
    enlace.rel = 'noopener noreferrer';
    enlace.textContent = 'Ver recurso ↗';
    tdEnlace.append(enlace);
  } else {
    tdEnlace.textContent = 'Enlace no válido';
  }
  const tdMotivo = document.createElement('td');
  tdMotivo.textContent = sug.justificacion || 'Sin justificación';
  const tdAcciones = document.createElement('td');
  const acciones = document.createElement('div');
  acciones.className = 'panel__acciones';
  acciones.append(crearBoton('aprobar', 'Aprobar', 'btn--aprobar'), crearBoton('rechazar', 'Rechazar', 'btn--rechazar'));
  tdAcciones.append(acciones);
  tr.append(tdNombre, tdCategoria, tdEnlace, tdMotivo, tdAcciones);
  return tr;
}
async function cargarSugerenciasAdmin() {
  mostrarAvisoPanel('Cargando sugerencias...');
  try {
    const resultado = await peticionAdmin('/api/admin/sugerencias');
    if (!resultado.ok) {
      mostrarAvisoPanel('No se pudieron cargar las sugerencias.');
      return;
    }
    filasPanel.replaceChildren(...resultado.sugerencias.map(crearFila));
    if (resultado.sugerencias.length === 0) mostrarAvisoPanel('No hay sugerencias por revisar.');
    else avisoPanel.hidden = true;
  } catch (error) {
    if (error.message !== 'Sesión expirada') {
      console.error('Error cargando el panel:', error);
      mostrarAvisoPanel('No se pudo conectar con el servidor. Verifique que esté encendido.');
    }
  }
}
filasPanel.addEventListener('click', async (e) => {
  const boton = e.target.closest('button[data-accion]');
  if (!boton) return;
  const fila = boton.closest('tr');
  const id = fila.dataset.id;
  const botonesFila = fila.querySelectorAll('button');
  botonesFila.forEach((b) => { b.disabled = true; });
  try {
    const esAprobar = boton.dataset.accion === 'aprobar';
    const resultado = await peticionAdmin(
      esAprobar ? `/api/admin/sugerencias/${id}/aprobar` : `/api/admin/sugerencias/${id}`,
      { method: esAprobar ? 'PUT' : 'DELETE' }
    );
    if (!resultado.ok) throw new Error(resultado.mensaje || 'El servidor no pudo completar la acción');
    if (esAprobar) {
      fila.classList.add('fila--aprobada');
      const estado = document.createElement('span');
      estado.className = 'estado';
      estado.textContent = '✓ Aprobado';
      fila.querySelector('.panel__acciones').replaceChildren(estado);
    } else {
      fila.classList.add('fila--saliendo');
      setTimeout(() => {
        fila.remove();
        if (filasPanel.children.length === 0) mostrarAvisoPanel('No hay sugerencias por revisar.');
      }, 350); 
    }
  } catch (error) {
    if (error.message === 'Sesión expirada') return;
    console.error('Error al procesar la acción del panel:', error);
    alert('No se pudo completar la acción. Verifique que el backend esté encendido.');
    botonesFila.forEach((b) => { b.disabled = false; }); 
  }
});
/* ---------- 4. FORMULARIO "SUGIERE UN RECURSO" ---------- */
const formSugerencia = document.getElementById('form-sugerencia');
const estadoSugerencia = document.getElementById('sug-estado');
formSugerencia.addEventListener('submit', async (e) => {
  e.preventDefault();
  const boton = formSugerencia.querySelector('button[type="submit"]');
  const datos = new FormData(formSugerencia);
  const sugerencia = {
    nombre: (datos.get('nombre') || '').trim(),
    correo: (datos.get('correo') || '').trim(),
    categoria: (datos.get('categoria') || '').trim(),
    enlace: (datos.get('enlace') || '').trim(),
    justificacion: (datos.get('justificacion') || '').trim()
  };
  estadoSugerencia.textContent = '';
  estadoSugerencia.classList.remove('formulario__estado--error');
  boton.disabled = true;
  boton.textContent = 'Enviando sugerencia...';
  try {
    const respuesta = await fetch(`${API_URL}/api/sugerencias`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sugerencia)
    });
    const resultado = await respuesta.json();
    if (respuesta.ok && resultado.ok) {
      estadoSugerencia.textContent = `¡Gracias, ${sugerencia.nombre.split(' ')[0]}! Tu sugerencia fue recibida y será revisada.`;
      formSugerencia.reset();
    } else {
      estadoSugerencia.textContent = resultado.mensaje || 'Hubo un problema al guardar la sugerencia.';
      estadoSugerencia.classList.add('formulario__estado--error');
    }
  } catch (error) {
    console.error('Error en la petición fetch:', error);
    estadoSugerencia.textContent = 'No se pudo conectar con el servidor. Inténtalo de nuevo en unos momentos.';
    estadoSugerencia.classList.add('formulario__estado--error');
  } finally {
    boton.disabled = false;
    boton.textContent = 'Enviar sugerencia';
  }
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
  return mensaje;
}
formChat.addEventListener('submit', async (e) => {
  e.preventDefault();
  const textoUsuario = inputChat.value.trim();
  if (textoUsuario === '') return;
  agregarMensaje(textoUsuario, 'chat__mensaje--usuario');
  inputChat.value = '';
  const mensajeCarga = agregarMensaje('El Guardián está reflexionando en silencio...', 'chat__mensaje--ia');
  const botonChat = formChat.querySelector('button[type="submit"]');
  botonChat.disabled = true;
  inputChat.disabled = true;
  try {
    const respuesta = await fetch(`${API_URL}/api/guardian/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mensaje: textoUsuario })
    });
    const resultado = await respuesta.json();
    mensajeCarga.remove();
    agregarMensaje(
      resultado.respuesta || 'Disculpe la interrupción en nuestro canal de comunicación. ¿Podría plantearme su inquietud nuevamente?',
      'chat__mensaje--ia'
    );
  } catch (error) {
    console.error('Error en la conexión del chat con el backend:', error);
    mensajeCarga.remove();
    agregarMensaje('En este momento no logro conectar con el templo del conocimiento. Por favor, inténtelo de nuevo en unos instantes.', 'chat__mensaje--ia');
  } finally {
    botonChat.disabled = false;
    inputChat.disabled = false;
    inputChat.focus();
  }
});

/* ---------- 6. FAVORITOS ---------- */
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
