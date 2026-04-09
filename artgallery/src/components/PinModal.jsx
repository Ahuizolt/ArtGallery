import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';

const commentsStore = {};
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;

export default function PinModal({ pin, onClose }) {
  const { isAuthenticated } = useAuth();
  const [comments, setComments] = useState(commentsStore[pin.id] || []);
  const [text, setText] = useState('');
  const [zoom, setZoom] = useState(1);
  const imgRef = useRef(null);

  // Cerrar con Escape, resetear zoom al cambiar pin
  useEffect(() => {
    setZoom(1);
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, pin.id]);

  // Zoom con rueda del ratón sobre la imagen
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    setZoom((prev) => {
      const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
      return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, +(prev + delta).toFixed(2)));
    });
  }, []);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    img.addEventListener('wheel', handleWheel, { passive: false });
    return () => img.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    const newComment = {
      id: Date.now(),
      text: text.trim(),
      date: new Date().toLocaleDateString('es-ES'),
    };
    const updated = [...comments, newComment];
    commentsStore[pin.id] = updated;
    setComments(updated);
    setText('');
  }

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={pin.title}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Cerrar">✕</button>

        <div className="modal-body">
          {/* ── Imagen con zoom ── */}
          <div className="modal-image-wrap" ref={imgRef}>
            <img
              src={pin.img}
              alt={pin.title}
              className="modal-image"
              style={{ transform: `scale(${zoom})`, transition: 'transform 0.2s ease' }}
              draggable={false}
            />

            {/* Controles de zoom */}
            <div className="zoom-controls">
              <button
                className="zoom-btn"
                onClick={() => setZoom((z) => Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(2)))}
                disabled={zoom >= MAX_ZOOM}
                aria-label="Acercar"
              >＋</button>
              <span className="zoom-level">{Math.round(zoom * 100)}%</span>
              <button
                className="zoom-btn"
                onClick={() => setZoom((z) => Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(2)))}
                disabled={zoom <= MIN_ZOOM}
                aria-label="Alejar"
              >－</button>
              {zoom !== 1 && (
                <button className="zoom-btn zoom-reset" onClick={() => setZoom(1)} aria-label="Restablecer zoom">
                  ↺
                </button>
              )}
            </div>
          </div>

          {/* ── Panel derecho ── */}
          <div className="modal-panel">
            <h2 className="modal-title">{pin.title}</h2>
            <p className="modal-author">por @{pin.author}</p>

            <div className="comments-section">
              <h3 className="comments-title">Comentarios</h3>

              <div className="comments-list">
                {comments.length === 0 && (
                  <p className="comments-empty">Sé el primero en comentar</p>
                )}
                {comments.map((c) => (
                  <div key={c.id} className="comment-item">
                    <p className="comment-text">{c.text}</p>
                    <span className="comment-date">{c.date}</span>
                  </div>
                ))}
              </div>

              {isAuthenticated ? (
                <form className="comment-form" onSubmit={handleSubmit}>
                  <input
                    type="text"
                    className="comment-input"
                    placeholder="Añade un comentario..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    maxLength={200}
                  />
                  <button type="submit" className="comment-submit" disabled={!text.trim()}>
                    Publicar
                  </button>
                </form>
              ) : (
                <p className="comments-login-hint">
                  <a href="/login">Inicia sesión</a> para comentar
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
