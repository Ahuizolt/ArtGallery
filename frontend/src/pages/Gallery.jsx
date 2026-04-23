import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getGallery } from '../services/imageApi';
import { searchGallery, getAllTags } from '../services/tagApi';
import ImageViewer from '../components/ImageViewer';
import ThemeToggle from '../components/ThemeToggle';
import { API_URL } from '../config';

export default function Gallery() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  // Búsqueda
  const [query, setQuery] = useState('');
  const [allTags, setAllTags] = useState([]);
  const [activeTags, setActiveTags] = useState([]); // etiquetas seleccionadas como filtro
  const [searching, setSearching] = useState(false);

  // Carga inicial
  useEffect(() => {
    Promise.all([getGallery(), getAllTags()])
      .then(([imgs, tags]) => { setImages(imgs); setAllTags(tags); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Búsqueda con debounce
  const doSearch = useCallback(async (q, tags) => {
    if (!q && tags.length === 0) {
      setSearching(true);
      getGallery().then(setImages).finally(() => setSearching(false));
      return;
    }
    setSearching(true);
    searchGallery(q, tags).then(setImages).catch(() => {}).finally(() => setSearching(false));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(query, activeTags), 300);
    return () => clearTimeout(timer);
  }, [query, activeTags, doSearch]);

  function toggleTag(tagName) {
    setActiveTags((prev) =>
      prev.includes(tagName) ? prev.filter((t) => t !== tagName) : [...prev, tagName]
    );
  }

  const isFiltering = query.length > 0 || activeTags.length > 0;

  return (
    <div className="app-layout">
      <header className="navbar">
        <span className="navbar-brand" onClick={() => navigate('/')}>
          <img src="/artgallery_logo.png" alt="ArtGallery" className="navbar-logo" />
        </span>
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
          <ThemeToggle />
        </nav>
      </header>

      <section className="gallery-hero">
        <h1>Descubre ideas que inspiran</h1>
        <p>Imágenes compartidas por la comunidad</p>
      </section>

      {/* ── Buscador ── */}
      <div className="gallery-search-bar">
        <div className="search-input-wrap">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por título o descripción..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button className="search-clear" onClick={() => setQuery('')}>✕</button>
          )}
        </div>

        {/* Etiquetas disponibles */}
        {allTags.length > 0 && (
          <div className="search-tags">
            {allTags.map((tag) => (
              <button
                key={tag.id}
                className={`search-tag ${activeTags.includes(tag.name) ? 'search-tag--active' : ''}`}
                onClick={() => toggleTag(tag.name)}
              >
                #{tag.name}
              </button>
            ))}
          </div>
        )}

        {isFiltering && (
          <p className="search-results-info">
            {searching ? 'Buscando...' : `${images.length} resultado${images.length !== 1 ? 's' : ''}`}
            <button className="search-reset" onClick={() => { setQuery(''); setActiveTags([]); }}>
              Limpiar filtros
            </button>
          </p>
        )}
      </div>

      <main className="gallery-main">
        {loading || searching ? (
          <div className="masonry-grid">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="pin-skeleton" style={{ height: `${180 + (i % 4) * 60}px` }} />
            ))}
          </div>
        ) : images.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">{isFiltering ? '🔍' : '🖼️'}</span>
            <p>{isFiltering ? 'No se encontraron imágenes con esos criterios.' : 'Aún no hay imágenes públicas.'}</p>
            {!isAuthenticated && !isFiltering && (
              <button className="btn-nav btn-nav--primary" onClick={() => navigate('/register')}>
                Sé el primero en publicar
              </button>
            )}
          </div>
        ) : (
          <div className="masonry-grid">
            {images.map((img) => (
              <div key={img.id} className="pin-card" onClick={() => setSelected(img)}>
                <img
                  src={`${API_URL}/uploads/${img.filename}`}
                  alt={img.title || img.original_name}
                  loading="lazy"
                />
                <div className="pin-overlay">
                  {img.title && <p className="pin-title">{img.title}</p>}
                  {img.owner && <p className="pin-owner">por {img.owner.username}</p>}
                  {img.tags && img.tags.length > 0 && (
                    <div className="pin-tags">
                      {img.tags.map((t) => <span key={t.name} className="pin-tag">#{t.name}</span>)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {selected && (
        <ImageViewer
          image={selected}
          allImages={images}
          onClose={() => setSelected(null)}
          onSelect={setSelected}
        />
      )}
    </div>
  );
}
