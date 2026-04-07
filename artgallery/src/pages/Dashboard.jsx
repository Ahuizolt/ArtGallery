import { useAuth } from '../hooks/useAuth';

const PINS = Array.from({ length: 12 }, (_, i) => i);

export default function Dashboard() {
  const { logout } = useAuth();
  return (
    <div className="dashboard-page">
      <nav className="dashboard-nav">
        <div className="nav-logo">
          <img src="/artgallery_icono.png" alt="Logo" style={{ width: 32, height: 32, objectFit: 'contain' }} />
        </div>
        <button className="btn-logout" onClick={logout}>Cerrar sesión</button>
      </nav>
      <div className="dashboard-content">
        <h1>Tu tablero</h1>
        <p>Aquí aparecerán tus pins guardados</p>
        <div className="pins-grid">
          {PINS.map((i) => <div key={i} className="pin-placeholder" />)}
        </div>
      </div>
    </div>
  );
}
