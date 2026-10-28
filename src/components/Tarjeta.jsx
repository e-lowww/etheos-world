// Una sola tarjeta; el catálogo la repite 16 veces con .map()
export default function Tarjeta({ pasion, favorito, aviso, onFav, onAbrir }) {
  return (
    <article className="tarjeta">
      <img src={`/img/${pasion.img}`} alt={pasion.nombre} className="tarjeta__imagen" />
      <h3 className="tarjeta__titulo">{pasion.nombre}</h3>
      <p className="tarjeta__categoria">{pasion.categoria}</p>
      {aviso && <p className="tarjeta__coincidencia">{aviso}</p>}
      <button type="button" className="btn btn--plano" onClick={onAbrir}>Entrar al conocimiento</button>
      <button type="button" className="tarjeta__fav" aria-pressed={favorito}
        aria-label={`Marcar ${pasion.nombre} como favorita`} onClick={onFav}>
        {favorito ? '♥' : '♡'}
      </button>
    </article>
  );
}
