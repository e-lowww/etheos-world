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
// Declaramos la función para que consulte a MongoDB
async function cargarSugerenciasAdmin() {
  const filasPanel = document.getElementById('panel-filas');
  const avisoVacio = document.getElementById('panel-vacio');
  if (!filasPanel) return;
  try {
    const respuesta = await fetch('http://localhost:3000/api/admin/sugerencias');
    const resultado = await respuesta.json();
    if (resultado.ok) {
      filasPanel.innerHTML = ''; 
      if (resultado.sugerencias.length === 0) {
        if (avisoVacio) avisoVacio.hidden = false;
        return;
      }
      if (avisoVacio) avisoVacio.hidden = true;
      resultado.sugerencias.forEach((sug) => {
        const tr = document.createElement('tr');
        tr.dataset.id = sug._id; // Guardamos el ID de MongoDB en la fila
        tr.innerHTML = `
          <td><strong>${sug.nombre}</strong><br><small>${sug.correo}</small></td>
          <td><span class="etiqueta">${sug.categoria}</span></td>
          <td><a href="${sug.enlace}" target="_blank" class="panel__link">Ver recurso ↗</a></td>
          <td>${sug.justificacion || '<i>Sin justificación</i>'}</td>
          <td class="panel__acciones">
            <button class="btn btn--aprobar" data-accion="aprobar">Aprobar</button>
            <button class="btn btn--rechazar" data-accion="rechazar">Rechazar</button>
          </td>
        `;
        filasPanel.appendChild(tr);
      });
    }
  } catch (error) {
    console.error('Error cargando el panel:', error);
  }
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
      // CONEXIÓN: Cargamos los datos reales justo al iniciar sesión con éxito
      cargarSugerenciasAdmin();
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
// CONEXIÓN: Si la sesión ya estaba activa al recargar la página, vuelve a pintar la tabla real
if (sessionStorage.getItem(CLAVE_SESION) === '1') {
  panelAdmin.hidden = false;
  cargarSugerenciasAdmin();
}

/* ---------- 3. PANEL: APROBAR / RECHAZAR (CONEXIÓN REAL) ---------- */
const filasPanel = document.getElementById('panel-filas');
const avisoVacio = document.getElementById('panel-vacio');
filasPanel.addEventListener('click', async (e) => {
  const boton = e.target.closest('button[data-accion]');
  if (!boton) return;
  const fila = boton.closest('tr');
  const idSugerencia = fila.dataset.id; // Obtenemos el ID único de MongoDB que inyectamos antes
  const accion = boton.dataset.accion;
  // Desactivamos temporalmente todos los botones de la fila por UX mientras responde el servidor
  const botonesFila = fila.querySelectorAll('button');
  botonesFila.forEach(b => b.disabled = true);
  try {
    if (accion === 'aprobar') {
      // Petición PUT al backend para aprobar de verdad
      const respuesta = await fetch(`http://localhost:3000/api/admin/sugerencias/${idSugerencia}/aprobar`, {
        method: 'PUT'
      });
      const resultado = await respuesta.json();
      if (resultado.ok) {
        fila.classList.add('fila--aprobada');
        fila.querySelector('.panel__acciones').innerHTML = '<span class="estado">✓ Aprobado</span>';
      }
    } else if (accion === 'rechazar') {
      // Petición DELETE al backend para borrar de verdad de MongoDB
      const respuesta = await fetch(`http://localhost:3000/api/admin/sugerencias/${idSugerencia}`, {
        method: 'DELETE'
      });
      const resultado = await respuesta.json();
      if (resultado.ok) {
        fila.classList.add('fila--saliendo');
        setTimeout(() => {
          fila.remove();
          if (avisoVacio) {
            avisoVacio.hidden = filasPanel.children.length > 0;
          }
        }, 350);
      }
    }
  } catch (error) {
    console.error('Error al procesar la acción del panel:', error);
    alert('No se pudo completar la acción. Revisa que el backend esté encendido.');
    // Volvemos a activar los botones si la red falló
    botonesFila.forEach(b => b.disabled = false);
  }
});

/* ---------- 4. FORMULARIO "SUGIERE UN RECURSO"  ---------- */
const formSugerencia = document.getElementById('form-sugerencia');
const estadoSugerencia = document.getElementById('sug-estado');
formSugerencia.addEventListener('submit', async (e) => {
  e.preventDefault(); // Evita que la página se recargue por defecto
  const boton = formSugerencia.querySelector('button[type="submit"]');
  const nombreInput = document.getElementById('sug-nombre');
  const correoInput = document.getElementById('sug-correo');
  const categoriaInput = document.getElementById('sug-categoria'); 
  const enlaceInput = document.getElementById('sug-enlace');
  // CORRECCIÓN: Intentamos buscar por 'sug-justificacion' o por 'sug-mensaje' en caso de que use el ID del reset CSS
  const justificacionInput = document.getElementById('sug-justificacion') || document.getElementById('sug-mensaje');
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
  // Extraemos el valor de forma segura verificando la existencia del nodo
  const textoJustificacion = (justificacionInput && justificacionInput.value) ? justificacionInput.value.trim() : "";
  const datosSugerencia = {
    nombre: nombreInput.value.trim(),
    correo: correoInput ? correoInput.value.trim() : "correo@ejemplo.com",
    categoria: categoriaInput ? categoriaInput.value.trim() : "General",
    enlace: enlaceInput.value.trim(),
    justificacion: textoJustificacion // Enviamos la variable procesada
  };
  try {
    const respuesta = await fetch('http://localhost:3000/api/sugerencias', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(datosSugerencia)
    });
    const resultado = await respuesta.json();
    if (resultado.ok) {
      estadoSugerencia.textContent = `¡Gracias, ${primerNombre}! Tu sugerencia se guardó en la base de datos de forma permanente.`;
      formSugerencia.reset();
    } else {
      estadoSugerencia.textContent = 'Hubo un problema en el servidor al guardar la sugerencia.';
      estadoSugerencia.classList.add('formulario__estado--error');
    }
  } catch (error) {
    console.error('Error en la petición fetch:', error);
    estadoSugerencia.textContent = 'No se pudo conectar con el servidor. Verifica que el backend esté encendido.';
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