import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getGallery } from '../services/imageApi';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Gallery() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getGallery()
      .then(setImages)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="app-layout">
      <header className="navbar">
        <span className="navbar-brand" onClick={() => navigate('/')}>🎨 Art Gallery</span>
        <nav className="navbar-links">
          {isAuthenticated ? (
            <>
              <button className="btn-nav" onClick={() => navigate('/dashboard')}>Mi tablero</button>
              <button className="btn-nav btn-nav--ghost" onClick={logout}>Cerrar sesión</button>
            </>
          ) : (
            <>
              <button className="btn-nav" onClick={() => navigate('/login')}>Iniciar sesión</button>
              <button className="btn-nav btn-nav--primary" onClick={() => navigate('/register')}>Registrarse</button>
            </>
          )}
        </nav>
      </header>

      <section className="gallery-hero">
        <h1>Descubre ideas que inspiran</h1>
        <p>Imágenes compartidas por la comunidad</p>
      </section>

      <main className="gallery-main">
        {loading ? (
          <div className="masonry-grid">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="pin-skeleton" style={{ height: `${180 + (i % 4) * 60}px` }} />
            ))}
          </div>
        ) : images.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🖼️</span>
            <p>Aún no hay imágenes públicas.</p>
            {!isAuthenticated && (
              <button className="btn-nav btn-nav--primary" onClick={() => navigate('/register')}>
                Sé el primero en publicar
              </button>
            )}
          </div>
        ) : (
          <div className="masonry-grid">
            {images.map((img) => (
              <div key={img.id} className="pin-card">
                <img
                  src={`${API_URL}/uploads/${img.filename}`}
                  alt={img.title || img.original_name}
                  loading="lazy"
                />
                <div className="pin-overlay">
                  {img.title && <p className="pin-title">{img.title}</p>}
                  {img.owner && <p className="pin-owner">por {img.owner.username}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
