function Recurso({ icono, titulo, recurso, extra = '' }) {
  return (
    <a href={recurso.url} target="_blank" rel="noopener noreferrer" className={`recurso ${extra}`}>
      <span className="recurso__icono">{icono}</span>
      <span className="recurso__texto"><strong>{titulo}</strong><small>{recurso.texto}</small></span>
    </a>
  );
}

// La vista interna de una pasión: descripción + sus 4 recursos
export default function VistaModulo({ pasion, onVolver }) {
  return (
    <section className="vista" style={{ display: 'block' }}>
      <button type="button" className="btn btn--volver" onClick={onVolver}>← Volver al Catálogo</button>
      <header className="vista__cabecera">
        <h2 className="vista__titulo">{pasion.nombre}</h2>
        <p className="vista__descripcion">{pasion.desc}</p>
      </header>
      <div className="vista__recursos">
        <Recurso icono="📺" titulo="Video Recomendado" recurso={pasion.video} />
        <Recurso icono="📰" titulo="Artículo de Alto Valor" recurso={pasion.articulo} />
        <Recurso icono="🎬" titulo="Serie de Referencia" recurso={pasion.serie} extra="recurso--serie" />
        <Recurso icono="🧪" titulo="Sesión Interactiva" recurso={pasion.sim} extra="recurso--sim" />
      </div>
    </section>
  );
}
