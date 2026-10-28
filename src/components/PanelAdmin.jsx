import { useEffect, useState } from 'react';
import { peticionAdmin } from '../api.js';

export default function PanelAdmin({ onSalir, onExpirada }) {
  const [sugerencias, setSugerencias] = useState([]);
  const [aviso, setAviso] = useState('Cargando sugerencias...');
  const [ocupadas, setOcupadas] = useState([]); // ids con una acción en curso

  // Si el token expiró, cierra la sesión; si no, muestra el mensaje de error
  function manejarError(error, mensaje) {
    if (error.message === 'Sesión expirada') return onExpirada();
    console.error(error);
    return mensaje;
  }

  useEffect(() => {
    let activo = true;
    peticionAdmin('/api/admin/sugerencias')
      .then((r) => {
        if (!activo) return;
        if (!r.ok) return setAviso('No se pudieron cargar las sugerencias.');
        setSugerencias(r.sugerencias.map((s) => ({ ...s, aprobada: false })));
        setAviso(r.sugerencias.length ? '' : 'No hay sugerencias por revisar.');
      })
      .catch((e) => activo && setAviso(manejarError(e, 'No se pudo conectar con el servidor. Verifique que esté encendido.') || ''));
    return () => { activo = false; };
  }, []);

  async function actuar(id, aprobar) {
    setOcupadas((o) => [...o, id]);
    try {
      const r = await peticionAdmin(
        aprobar ? `/api/admin/sugerencias/${id}/aprobar` : `/api/admin/sugerencias/${id}`,
        { method: aprobar ? 'PUT' : 'DELETE' }
      );
      if (!r.ok) throw new Error(r.mensaje || 'El servidor no pudo completar la acción');
      if (aprobar) {
        setSugerencias((l) => l.map((s) => (s._id === id ? { ...s, aprobada: true } : s)));
      } else {
        const resto = sugerencias.filter((s) => s._id !== id);
        setSugerencias(resto);
        if (resto.length === 0) setAviso('No hay sugerencias por revisar.');
      }
    } catch (error) {
      const m = manejarError(error, 'No se pudo completar la acción. Verifique que el backend esté encendido.');
      if (m) alert(m);
    } finally {
      setOcupadas((o) => o.filter((x) => x !== id));
    }
  }

  return (
    <section id="panel-admin" className="panel">
      <header className="seccion__cabecera">
        <p className="seccion__etiqueta">Administración</p>
        <h2 className="seccion__titulo">Panel de Etheos</h2>
        <p className="seccion__texto">Revisa, aprueba o rechaza las sugerencias de la comunidad.</p>
        <button type="button" className="btn btn--oscuro panel__salir" onClick={onSalir}>Cerrar sesión</button>
      </header>
      <div className="panel__tabla-contenedor">
        <table className="panel__tabla">
          <thead>
            <tr>
              <th scope="col">Nombre</th><th scope="col">Hobby</th><th scope="col">Link</th>
              <th scope="col">Justificación</th><th scope="col">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {sugerencias.map((s) => (
              <tr key={s._id}>
                <td><strong>{s.nombre}</strong><br /><small>{s.correo}</small></td>
                <td><span className="etiqueta">{s.categoria}</span></td>
                <td>
                  {/^https?:\/\//i.test(s.enlace)
                    ? <a className="panel__link" href={s.enlace} target="_blank" rel="noopener noreferrer">Ver recurso ↗</a>
                    : 'Enlace no válido'}
                </td>
                <td>{s.justificacion || 'Sin justificación'}</td>
                <td>
                  {s.aprobada ? <span className="estado">✓ Aprobado</span> : (
                    <div className="panel__acciones">
                      <button type="button" className="btn btn--aprobar" disabled={ocupadas.includes(s._id)} onClick={() => actuar(s._id, true)}>Aprobar</button>
                      <button type="button" className="btn btn--rechazar" disabled={ocupadas.includes(s._id)} onClick={() => actuar(s._id, false)}>Rechazar</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {aviso && <p className="panel__vacio">{aviso}</p>}
      </div>
    </section>
  );
}
