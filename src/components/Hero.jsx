import { useEffect, useState } from 'react';

export default function Hero() {
  const [usuarios, setUsuarios] = useState('0');

  // Contador animado de "usuarios": sube rápido y termina en ∞
  useEffect(() => {
    let n = 0;
    const timer = setInterval(() => {
      n += Math.floor(Math.random() * 15) + 5;
      if (n >= 900) { clearInterval(timer); setUsuarios('∞'); }
      else setUsuarios(`+${n}`);
    }, 10);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="inicio" className="hero">
      <figure className="hero__figura">
        <img src="/img/hero-gato.jpg" alt="Ilustración de un gato" className="hero__imagen" />
      </figure>
      <div className="hero__texto">
        <p className="seccion__etiqueta">Aprende con calma</p>
        <h1 className="hero__titulo">ETHEOS</h1>
        <p className="hero__lema">El carácter divino del conocimiento a través de tus pasiones</p>
        <p className="hero__parrafo">
          Vivimos rodeados de pantallas que compiten por cada segundo de nuestra atención. Las redes sociales fragmentan la mente con estímulos infinitos y vacíos.
          Etheos nace como un refugio: un espacio sereno donde cada visita es un módulo breve de aprendizaje concentrado e individual, guiado por aquello que de verdad te apasiona. Aquí no hay notificaciones ni desplazamientos sin fin, solo tú, tu curiosidad y recursos cuidadosamente seleccionados para que cada minuto te deje algo valioso.
        </p>
        <div className="hero__acciones">
          <a href="#catalogo" className="btn btn--oscuro">Explorar el catálogo</a>
          <a href="#contacto" className="btn btn--secundario">Sugerir un recurso</a>
        </div>
        <ul className="hero__datos">
          <li><strong>16</strong> pasiones</li>
          <li><strong className="numero-animado">{usuarios}</strong> usuarios</li>
          <li><strong>4</strong> recursos por módulo</li>
        </ul>
      </div>
    </section>
  );
}
