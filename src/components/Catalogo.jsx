import { useEffect, useRef, useState } from 'react';
import { PASIONES } from '../data/pasiones.js';
import Tarjeta from './Tarjeta.jsx';
import VistaModulo from './VistaModulo.jsx';

const CLAVE_FAVORITOS = 'etheosFavoritos';
const leerFavoritos = () => {
  try { return JSON.parse(localStorage.getItem(CLAVE_FAVORITOS)) || []; } catch { return []; }
};
// "Química", "QUIMICA" y "quimica" se leen igual
const normalizar = (t) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export default function Catalogo() {
  const [busqueda, setBusqueda] = useState('');
  const [abierta, setAbierta] = useState(null); // id de la pasión abierta, o null
  const [favoritos, setFavoritos] = useState(leerFavoritos);
  const seccion = useRef(null);

  useEffect(() => {
    try { localStorage.setItem(CLAVE_FAVORITOS, JSON.stringify(favoritos)); } catch { /* sin almacenamiento */ }
  }, [favoritos]);

  const cambiarVista = (id) => {
    setAbierta(id);
    setTimeout(() => seccion.current?.scrollIntoView(), 0);
  };
  const alternarFav = (id) =>
    setFavoritos((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));

  // Una tarjeta se queda si CADA palabra aparece en su nombre/categoría o en alguno de sus recursos
  const palabras = normalizar(busqueda).split(' ').filter(Boolean);
  const resultados = PASIONES.map((p) => {
    const propio = normalizar(`${p.nombre} ${p.categoria}`);
    const nombres = [p.video, p.articulo, p.serie, p.sim].map((r) => r.texto);
    const normales = nombres.map(normalizar);
    const coincide = palabras.every((w) => propio.includes(w) || normales.some((r) => r.includes(w)));
    const porNombre = palabras.every((w) => propio.includes(w));
    const hallados = nombres.filter((_, i) => palabras.some((w) => normales[i].includes(w)));
    const aviso = coincide && !porNombre && hallados.length ? `Incluye: ${hallados.join(' · ')}` : '';
    return { p, coincide, aviso };
  }).filter((r) => r.coincide);

  const pasionAbierta = PASIONES.find((p) => p.id === abierta);

  return (
    <section id="catalogo" className="catalogo" ref={seccion}>
      <header className="seccion__cabecera">
        <p className="seccion__etiqueta">Catálogo</p>
        <h2 className="seccion__titulo">ELIGE TU PASIÓN</h2>
        <p className="seccion__texto">Dieciséis puertas hacia el conocimiento,<br />cada una abre un módulo con recursos</p>
        {!pasionAbierta && (
          <div className="buscador" role="search">
            <label htmlFor="buscador-input" className="sr-only">Buscar en el catálogo</label>
            <span className="buscador__icono" aria-hidden="true">🔍</span>
            <input type="search" id="buscador-input" className="campo__input buscador__input"
              placeholder="Busca una tarjeta..." autoComplete="off" value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)} />
            {busqueda && (
              <button type="button" className="buscador__limpiar" aria-label="Borrar búsqueda" onClick={() => setBusqueda('')}>✕</button>
            )}
          </div>
        )}
      </header>

      {pasionAbierta ? (
        <VistaModulo pasion={pasionAbierta} onVolver={() => cambiarVista(null)} />
      ) : (
        <>
          <div className="catalogo__grid">
            {resultados.map(({ p, aviso }) => (
              <Tarjeta key={p.id} pasion={p} aviso={aviso} favorito={favoritos.includes(p.id)}
                onFav={() => alternarFav(p.id)} onAbrir={() => cambiarVista(p.id)} />
            ))}
          </div>
          {resultados.length === 0 && (
            <p className="catalogo__vacio" role="status">No encontramos nada con esa búsqueda. Prueba con otra palabra.</p>
          )}
        </>
      )}
    </section>
  );
}
