import { useEffect, useCallback, useState } from 'react';
import { TransformWrapper, TransformComponent, useControls } from 'react-zoom-pan-pinch';
import { useAuth } from '../hooks/useAuth';
import { getMyBoards, createBoard, saveImageToBoard } from '../services/boardApi';
import { getComments, addComment, deleteComment } from '../services/commentApi';
import { API_URL } from '../config';

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

function SaveToBoard({ imageId, accessToken, onClose }) {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(null);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    getMyBoards(accessToken)
      .then(setBoards)
      .catch(() => setFeedback('Error al cargar tableros'))
      .finally(() => setLoading(false));
  }, [accessToken]);

  async function handleSave(boardId) {
    setSaving(boardId);
    setFeedback('');
    try {
      await saveImageToBoard(boardId, imageId, accessToken);
      setFeedback('Guardado correctamente');
    } catch (err) {
      setFeedback(err.message);
    } finally {
      setSaving(null);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setFeedback('');
    try {
      const board = await createBoard(newName.trim(), accessToken);
      setBoards((prev) => [board, ...prev]);
      setNewName('');
      await handleSave(board.id);
    } catch (err) {
      setFeedback(err.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="save-panel" onClick={(e) => e.stopPropagation()}>
      <div className="save-panel-header">
        <span>Guardar en tablero</span>
        <button className="save-panel-close" onClick={onClose}>✕</button>
      </div>
      {feedback && (
        <p className={`save-feedback ${feedback.startsWith('Guardado') ? 'save-feedback--ok' : 'save-feedback--err'}`}>
          {feedback}
        </p>
      )}
      {loading ? (
        <p className="save-loading">Cargando tableros...</p>
      ) : (
        <div className="save-board-list">
          {boards.length === 0 && <p className="save-empty">No tienes tableros aún</p>}
          {boards.map((b) => (
            <button
              key={b.id}
              className="save-board-item"
              onClick={() => handleSave(b.id)}
              disabled={saving === b.id}
            >
              <span className="save-board-icon">📌</span>
              <span className="save-board-name">{b.name}</span>
              <span className="save-board-count">{b.image_count} imgs</span>
              {saving === b.id && <span className="save-spinner">…</span>}
            </button>
          ))}
        </div>
      )}
      <form className="save-new-form" onSubmit={handleCreate}>
        <input
          type="text"
          className="save-new-input"
          placeholder="Nuevo tablero..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          maxLength={60}
        />
        <button type="submit" className="save-new-btn" disabled={creating || !newName.trim()}>
          {creating ? '…' : '+'}
        </button>
      </form>
    </div>
  );
}

// ── Sección de comentarios ──
function CommentsSection({ imageId, accessToken, isAuthenticated }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    setLoading(true);
    getComments(imageId)
      .then(setComments)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [imageId]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setPosting(true);
    try {
      const comment = await addComment(imageId, text.trim(), accessToken);
      setComments((prev) => [...prev, comment]);
      setText('');
    } catch {
      // silencioso
    } finally {
      setPosting(false);
    }
  }

  async function handleDelete(commentId) {
    try {
      await deleteComment(imageId, commentId, accessToken);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch {
      // silencioso
    }
  }

  return (
    <div className="vw-comments">
      <h3 className="vw-comments-title">Comentarios {comments.length > 0 && `(${comments.length})`}</h3>

      <div className="vw-comments-list">
        {loading && <p className="vw-comments-empty">Cargando...</p>}
        {!loading && comments.length === 0 && (
          <p className="vw-comments-empty">Sé el primero en comentar</p>
        )}
        {comments.map((c) => (
          <div key={c.id} className="vw-comment">
            <div className="vw-comment-avatar">{c.author?.username?.[0]?.toUpperCase() || '?'}</div>
            <div className="vw-comment-body">
              <span className="vw-comment-author">{c.author?.username || 'Usuario'}</span>
              <p className="vw-comment-text">{c.text}</p>
            </div>
            {isAuthenticated && (
              <button className="vw-comment-delete" onClick={() => handleDelete(c.id)} title="Eliminar">✕</button>
            )}
          </div>
        ))}
      </div>

      {isAuthenticated ? (
        <form className="vw-comment-form" onSubmit={handleSubmit}>
          <input
            type="text"
            className="vw-comment-input"
            placeholder="Escribe un comentario..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={500}
          />
          <button type="submit" className="vw-comment-submit" disabled={posting || !text.trim()}>
            {posting ? '…' : '↑'}
          </button>
        </form>
      ) : (
        <p className="vw-comments-login">
          <a href="/login">Inicia sesión</a> para comentar
        </p>
      )}
    </div>
  );
}

export default function ImageViewer({ image, allImages, onClose, onSelect }) {
  const { isAuthenticated, accessToken } = useAuth();
  const [showSave, setShowSave] = useState(false);
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
    setShowSave(false);
  }, [image.id]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        if (showSave) setShowSave(false);
        else onClose();
      }
      if (e.key === 'ArrowRight' && !showSave) goNext();
      if (e.key === 'ArrowLeft' && !showSave) goPrev();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose, goNext, goPrev, showSave]);

  async function handleDownload() {
    try {
      const res = await fetch(`${API_URL}/uploads/${image.filename}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = image.original_name || image.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // fallback si el fetch falla
      const a = document.createElement('a');
      a.href = `${API_URL}/uploads/${image.filename}`;
      a.download = image.original_name || image.filename;
      a.click();
    }
  }

  const others = allImages.filter((i) => i.id !== image.id);
  const imgSrc = `${API_URL}/uploads/${image.filename}`;

  return (
    <div className="vw-backdrop" onClick={onClose}>
      <div className="vw-shell" onClick={(e) => e.stopPropagation()}>

        <div className="vw-left">
          <div className="vw-topbar">
            <button className="vw-close" onClick={onClose}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>

            <div className="vw-topbar-right">
              <span className="vw-hint">Pellizca o usa la rueda para hacer zoom · arrastra para mover</span>

              {isAuthenticated && (
                <div className="vw-save-wrap">
                  <button
                    className={`vw-save-btn${showSave ? ' vw-save-btn--active' : ''}`}
                    onClick={() => setShowSave((v) => !v)}
                  >
                    <svg viewBox="0 0 24 24" fill={showSave ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.2" width="16" height="16">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                    </svg>
                    Guardar
                  </button>
                  {showSave && (
                    <SaveToBoard
                      imageId={image.id}
                      accessToken={accessToken}
                      onClose={() => setShowSave(false)}
                    />
                  )}
                </div>
              )}

              <button className="vw-download-btn" onClick={handleDownload}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M12 3v13M7 11l5 5 5-5"/>
                  <path d="M5 20h14"/>
                </svg>
                Descargar
              </button>
            </div>
          </div>

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

        <aside className="vw-sidebar">
          {others.length > 0 && (
            <>
              <p className="vw-sidebar-label">
                Más imágenes
                {others.length > 4 && <span className="vw-sidebar-count"> · {others.length} en total</span>}
              </p>
              <div className="vw-sidebar-list">
                {others.slice(0, 4).map((img) => (
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
            </>
          )}
          <CommentsSection
            imageId={image.id}
            accessToken={accessToken}
            isAuthenticated={isAuthenticated}
          />
        </aside>
      </div>
    </div>
  );
}
