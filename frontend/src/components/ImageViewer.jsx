import { useEffect, useCallback } from 'react';
import { TransformWrapper, TransformComponent, useControls } from 'react-zoom-pan-pinch';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Controles internos que usan el contexto de TransformWrapper
function ZoomControls() {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  return (
    <div className="vw-zoom-controls">
      <button className="vw-zoom-btn" onClick={() => zoomIn()} title="Acercar">+</button>
      <button className="vw-zoom-btn" onClick={() => zoomOut()} title="Alejar">−</button>
      <button className="vw-zoom-btn vw-zoom-btn--reset" onClick={() => resetTransform()} title="Restablecer">↺</button>
    </div>
  );
}

export default function ImageViewer({ image, allImages, onClose, onSelect }) {
  const currentIndex = allImages.findIndex((i) => i.id === image.id);

  const goNext = useCallback(() => {
    const next = allImages[(currentIndex + 1) % allImages.length];
    if (next) onSelect(next);
  }, [currentIndex, allImages, onSelect]);

  const goPrev = useCallback(() => {
    const prev = allImages[(currentIndex - 1 + allImages.length) % allImages.length];
    if (prev) onSelect(prev);
  }, [currentIndex, allImages, onSelect]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose, goNext, goPrev]);

  function handleDownload() {
    const a = document.createElement('a');
    a.href = `${API_URL}/uploads/${image.filename}`;
    a.download = image.original_name || image.filename;
    a.target = '_blank';
    a.click();
  }

  const others = allImages.filter((i) => i.id !== image.id);
  const imgSrc = `${API_URL}/uploads/${image.filename}`;

  return (
    <div className="vw-backdrop" onClick={onClose}>
      <div className="vw-shell" onClick={(e) => e.stopPropagation()}>

        {/* ── Columna izquierda ── */}
        <div className="vw-left">

          {/* Topbar */}
          <div className="vw-topbar">
            <button className="vw-close" onClick={onClose}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
            <div className="vw-topbar-right">
              <span className="vw-hint">Pellizca o usa la rueda para hacer zoom · arrastra para mover</span>
              <button className="vw-download-btn" onClick={handleDownload}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M12 3v13M7 11l5 5 5-5"/>
                  <path d="M5 20h14"/>
                </svg>
                Descargar
              </button>
            </div>
          </div>

          {/* Imagen con zoom/pan */}
          <div className="vw-img-area">
            <TransformWrapper
              key={image.id}
              initialScale={1}
              minScale={0.5}
              maxScale={6}
              doubleClick={{ mode: 'zoomIn', step: 1.5 }}
              wheel={{ step: 0.12 }}
              pinch={{ step: 8 }}
              centerOnInit
            >
              <ZoomControls />
              <TransformComponent
                wrapperStyle={{ width: '100%', height: '100%' }}
                contentStyle={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <img
                  src={imgSrc}
                  alt={image.title || image.original_name}
                  className="vw-img"
                  draggable={false}
                />
              </TransformComponent>
            </TransformWrapper>
          </div>

          {/* Info + nav */}
          <div className="vw-bottom">
            <div className="vw-meta">
              {image.title && <h2 className="vw-title">{image.title}</h2>}
              {image.description && <p className="vw-desc">{image.description}</p>}
              {image.owner && (
                <div className="vw-author">
                  <div className="vw-avatar">{image.owner.username[0].toUpperCase()}</div>
                  <span>{image.owner.username}</span>
                </div>
              )}
            </div>

            {allImages.length > 1 && (
              <div className="vw-nav">
                <button className="vw-nav-btn" onClick={goPrev}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M15 18l-6-6 6-6"/>
                  </svg>
                </button>
                <span className="vw-nav-count">{currentIndex + 1} / {allImages.length}</span>
                <button className="vw-nav-btn" onClick={goNext}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Sidebar derecha ── */}
        {others.length > 0 && (
          <aside className="vw-sidebar">
            <p className="vw-sidebar-label">Más imágenes</p>
            <div className="vw-sidebar-list">
              {others.map((img) => (
                <div key={img.id} className="vw-sitem" onClick={() => onSelect(img)}>
                  <div className="vw-sitem-img">
                    <img
                      src={`${API_URL}/uploads/${img.filename}`}
                      alt={img.title || img.original_name}
                      loading="lazy"
                    />
                  </div>
                  <div className="vw-sitem-info">
                    <p className="vw-sitem-title">{img.title || img.original_name}</p>
                    {img.owner && <p className="vw-sitem-owner">@{img.owner.username}</p>}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
