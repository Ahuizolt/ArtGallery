import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { PINS } from '../data/pins';
import PinModal from '../components/PinModal';

export default function Feed() {
  const { isAuthenticated, logout } = useAuth();
  const [selectedPin, setSelectedPin] = useState(null);

  return (
    <div className="dashboard-page">
      <nav className="dashboard-nav">
        <div className="nav-logo">
          <img src="/artgallery_icono.png" alt="Logo" style={{ width: 32, height: 32, objectFit: 'contain' }} />
        </div>

        <div className="nav-actions">
          {isAuthenticated ? (
            <>
              {/* Botón secundario → Mis Tableros */}
              <Link to="/dashboard" className="btn-secondary">Mis Tableros</Link>
              <button className="btn-logout" onClick={logout}>Cerrar sesión</button>
            </>
          ) : (
            <>
              <Link to="/register" className="btn-secondary">Registrarse</Link>
              <Link to="/login" className="btn-logout">Iniciar sesión</Link>
            </>
          )}
        </div>
      </nav>

      <div className="dashboard-content">
        <h1>Galería pública</h1>
        <p>Explora las ideas de la comunidad</p>

        <div className="pins-grid">
          {PINS.map((pin) => (
            <div
              key={pin.id}
              className="pin-card"
              onClick={() => setSelectedPin(pin)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setSelectedPin(pin)}
              aria-label={`Ver ${pin.title}`}
            >
              <img src={pin.img} alt={pin.title} className="pin-img" loading="lazy" />
              <div className="pin-info">
                <p className="pin-title">{pin.title}</p>
                <p className="pin-author">@{pin.author}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedPin && (
        <PinModal pin={selectedPin} onClose={() => setSelectedPin(null)} />
      )}
    </div>
  );
}
