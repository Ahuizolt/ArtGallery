import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { uploadImage, getMyImages, updateImage, deleteImage } from '../services/imageApi';
import { getMyBoards, getBoardImages, deleteBoard } from '../services/boardApi';
import { setImageTags } from '../services/tagApi';
import ImageViewer from '../components/ImageViewer';
import ThemeToggle from '../components/ThemeToggle';
import { API_URL } from '../config';

// Sección de un tablero expandible
function BoardSection({ board, accessToken, onImageClick }) {
  const [images, setImages] = useState(null); // null = no cargado aún
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!open && images === null) {
      setLoading(true);
      try {
        const imgs = await getBoardImages(board.id, accessToken);
        setImages(imgs);
      } catch {
        setImages([]);
      } finally {
        setLoading(false);
      }
    }
    setOpen((v) => !v);
  }

  return (
    <div className="board-section">
      <div className="board-section-header" onClick={toggle}>
        <div className="board-section-info">
          <span className="board-section-icon">📌</span>
          <span className="board-section-name">{board.name}</span>
          <span className="board-section-count">{board.image_count} imgs</span>
        </div>
        <span className={`board-section-arrow ${open ? 'board-section-arrow--open' : ''}`}>▾</span>
      </div>

      {open && (
        <div className="board-section-body">
          {loading && <p className="board-section-loading">Cargando...</p>}
          {!loading && images && images.length === 0 && (
            <p className="board-section-empty">Este tablero está vacío</p>
          )}
          {!loading && images && images.length > 0 && (
            <div className="board-images-grid">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="board-img-card"
                  onClick={() => onImageClick(img, images)}
                >
                  <img
                    src={`${API_URL}/uploads/${img.filename}`}
                    alt={img.title || img.original_name}
                    loading="lazy"
                  />
                  {img.title && <p className="board-img-title">{img.title}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { logout, accessToken } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [images, setImages] = useState([]);
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [selectedAll, setSelectedAll] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', is_public: false, tagsInput: '' });
  const [activeTab, setActiveTab] = useState('images'); // 'images' | 'boards'

  useEffect(() => {
    Promise.all([
      getMyImages(accessToken),
      getMyBoards(accessToken),
    ])
      .then(([imgs, bds]) => {
        setImages(imgs);
        setBoards(bds);
      })
      .catch(() => setError('Error al cargar datos'))
      .finally(() => setLoading(false));
  }, []);

  function openModal() {
    setForm({ title: '', description: '', is_public: false, tagsInput: '' });
    setPreview(null);
    setError('');
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
  }

  async function handleUpload(e) {
    e.preventDefault();
    const file = fileInputRef.current?.files[0];
    if (!file) return setError('Selecciona una imagen');
    const formData = new FormData();
    formData.append('image', file);
    formData.append('title', form.title);
    formData.append('description', form.description);
    formData.append('is_public', form.is_public);
    setUploading(true);
    setError('');
    try {
      const newImage = await uploadImage(formData, accessToken);
      // Guardar etiquetas si se especificaron
      if (form.tagsInput.trim()) {
        const tagNames = form.tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
        if (tagNames.length > 0) {
          await setImageTags(newImage.id, tagNames, accessToken);
        }
      }
      setImages((prev) => [newImage, ...prev]);
      closeModal();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function togglePublic(img) {
    try {
      const updated = await updateImage(img.id, { is_public: !img.is_public }, accessToken);
      setImages((prev) => prev.map((i) => (i.id === img.id ? updated : i)));
    } catch {
      setError('Error al actualizar');
    }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar esta imagen?')) return;
    try {
      await deleteImage(id, accessToken);
      setImages((prev) => prev.filter((i) => i.id !== id));
    } catch {
      setError('Error al eliminar');
    }
  }

  async function handleDeleteBoard(boardId) {
    if (!confirm('¿Eliminar este tablero?')) return;
    try {
      await deleteBoard(boardId, accessToken);
      setBoards((prev) => prev.filter((b) => b.id !== boardId));
    } catch {
      setError('Error al eliminar tablero');
    }
  }

  function openImageFromBoard(img, allBoardImages) {
    setSelected(img);
    setSelectedAll(allBoardImages);
  }

  return (
    <div className="app-layout">
      <header className="navbar">
        <span className="navbar-brand" onClick={() => navigate('/')}>
          <img src="/artgallery_logo.png" alt="ArtGallery" className="navbar-logo" />
        </span>
        <nav className="navbar-links">
          <button className="btn-nav" onClick={() => navigate('/gallery')}>Galería pública</button>
          <button className="btn-nav btn-nav--ghost" onClick={logout}>Cerrar sesión</button>
          <ThemeToggle />
        </nav>
      </header>

      <section className="board-hero">
        <div className="board-hero-content">
          <h1>Mi Tablero</h1>
          <p>{images.length} {images.length === 1 ? 'imagen' : 'imágenes'} · {boards.length} {boards.length === 1 ? 'tablero' : 'tableros'}</p>
        </div>
        <button className="btn-upload-trigger" onClick={openModal}>
          <span>+</span> Subir imagen
        </button>
      </section>

      {/* Tabs */}
      <div className="dashboard-tabs">
        <button
          className={`dashboard-tab ${activeTab === 'images' ? 'dashboard-tab--active' : ''}`}
          onClick={() => setActiveTab('images')}
        >
          🖼️ Mis imágenes
        </button>
        <button
          className={`dashboard-tab ${activeTab === 'boards' ? 'dashboard-tab--active' : ''}`}
          onClick={() => setActiveTab('boards')}
        >
          📌 Mis tableros
        </button>
      </div>

      <main className="gallery-main">
        {/* ── Tab: Imágenes ── */}
        {activeTab === 'images' && (
          <>
            {loading ? (
              <div className="masonry-grid">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="pin-skeleton" style={{ height: `${180 + (i % 3) * 70}px` }} />
                ))}
              </div>
            ) : images.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">📌</span>
                <p>Tu tablero está vacío.</p>
                <button className="btn-nav btn-nav--primary" onClick={openModal}>
                  Sube tu primera imagen
                </button>
              </div>
            ) : (
              <div className="masonry-grid">
                {images.map((img) => (
                  <div key={img.id} className="pin-card pin-card--owned" onClick={() => { setSelected(img); setSelectedAll(images); }}>
                    <img
                      src={`${API_URL}/uploads/${img.filename}`}
                      alt={img.title || img.original_name}
                      loading="lazy"
                    />
                    <div className="pin-overlay">
                      {img.title && <p className="pin-title">{img.title}</p>}
                      <div className="pin-actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          className={`badge-visibility ${img.is_public ? 'badge-visibility--public' : ''}`}
                          onClick={() => togglePublic(img)}
                        >
                          {img.is_public ? '🌐 Pública' : '🔒 Privada'}
                        </button>
                        <button className="btn-icon-delete" onClick={() => handleDelete(img.id)}>🗑</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Tab: Tableros ── */}
        {activeTab === 'boards' && (
          <>
            {loading ? (
              <p className="board-section-loading">Cargando tableros...</p>
            ) : boards.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">📌</span>
                <p>No tienes tableros aún. Guarda imágenes desde la galería.</p>
                <button className="btn-nav btn-nav--primary" onClick={() => navigate('/gallery')}>
                  Ir a la galería
                </button>
              </div>
            ) : (
              <div className="boards-list">
                {boards.map((board) => (
                  <div key={board.id} className="board-section-wrap">
                    <BoardSection
                      board={board}
                      accessToken={accessToken}
                      onImageClick={openImageFromBoard}
                    />
                    <button
                      className="board-delete-btn"
                      onClick={() => handleDeleteBoard(board.id)}
                      title="Eliminar tablero"
                    >
                      🗑
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <button className="fab" onClick={openModal}>+</button>

      {selected && (
        <ImageViewer
          image={selected}
          allImages={selectedAll.length > 0 ? selectedAll : images}
          onClose={() => { setSelected(null); setSelectedAll([]); }}
          onSelect={setSelected}
        />
      )}

      {showModal && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Subir imagen</h2>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleUpload} className="modal-body">
              <label className="drop-zone" htmlFor="file-input">
                {preview ? (
                  <img src={preview} alt="Vista previa" className="drop-zone-preview" />
                ) : (
                  <div className="drop-zone-placeholder">
                    <span>🖼️</span>
                    <p>Haz clic para elegir una imagen</p>
                    <small>JPG, PNG, WEBP, GIF, SVG, BMP, AVIF — máx. 5MB</small>
                  </div>
                )}
              </label>
              <input id="file-input" ref={fileInputRef} type="file" accept="image/*"
                className="file-input-hidden" onChange={handleFileChange} required />
              <input type="text" className="modal-input" placeholder="Título (opcional)"
                value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
              <textarea className="modal-input modal-textarea" placeholder="Descripción (opcional)"
                value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />

              <input
                type="text"
                className="modal-input"
                placeholder="Etiquetas: naturaleza, viaje, arte (separadas por comas)"
                value={form.tagsInput}
                onChange={(e) => setForm((p) => ({ ...p, tagsInput: e.target.value }))}
              />
              <label className="toggle-label">
                <div className={`toggle ${form.is_public ? 'toggle--on' : ''}`}
                  onClick={() => setForm((p) => ({ ...p, is_public: !p.is_public }))}>
                  <div className="toggle-thumb" />
                </div>
                <span>Publicar en galería pública</span>
              </label>
              {error && <p className="modal-error">{error}</p>}
              <div className="modal-footer">
                <button type="button" className="btn-nav btn-nav--ghost" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn-nav btn-nav--primary" disabled={uploading}>
                  {uploading ? 'Subiendo...' : 'Subir imagen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
