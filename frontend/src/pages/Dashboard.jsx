import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { uploadImage, getMyImages, updateImage, deleteImage } from '../services/imageApi';
import ImageViewer from '../components/ImageViewer';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Dashboard() {
  const { logout, accessToken } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', is_public: false });

  useEffect(() => {
    getMyImages(accessToken)
      .then(setImages)
      .catch(() => setError('Error al cargar tus imágenes'))
      .finally(() => setLoading(false));
  }, []);

  function openModal() {
    setForm({ title: '', description: '', is_public: false });
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

  return (
    <div className="app-layout">
      {/* Navbar */}
      <header className="navbar">
        <span className="navbar-brand" onClick={() => navigate('/')}>🎨 Art Gallery</span>
        <nav className="navbar-links">
          <button className="btn-nav" onClick={() => navigate('/gallery')}>Galería pública</button>
          <button className="btn-nav btn-nav--ghost" onClick={logout}>Cerrar sesión</button>
        </nav>
      </header>

      {/* Hero del tablero */}
      <section className="board-hero">
        <div className="board-hero-content">
          <h1>Mi Tablero</h1>
          <p>{images.length} {images.length === 1 ? 'imagen' : 'imágenes'}</p>
        </div>
        <button className="btn-upload-trigger" onClick={openModal} aria-label="Subir imagen">
          <span>+</span> Subir imagen
        </button>
      </section>

      {/* Grid personal */}
      <main className="gallery-main">
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
              <div key={img.id} className="pin-card pin-card--owned">
                <img
                  src={`${API_URL}/uploads/${img.filename}`}
                  alt={img.title || img.original_name}
                  loading="lazy"
                  onClick={() => setSelected(img)}
                  style={{ cursor: 'pointer' }}
                />
                <div className="pin-overlay">
                  {img.title && <p className="pin-title">{img.title}</p>}
                  <div className="pin-actions">
                    <button
                      className={`badge-visibility ${img.is_public ? 'badge-visibility--public' : ''}`}
                      onClick={() => togglePublic(img)}
                      title={img.is_public ? 'Quitar de galería pública' : 'Publicar en galería'}
                    >
                      {img.is_public ? '🌐 Pública' : '🔒 Privada'}
                    </button>
                    <button className="btn-icon-delete" onClick={() => handleDelete(img.id)} title="Eliminar">
                      🗑
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* FAB flotante */}
      <button className="fab" onClick={openModal} aria-label="Subir imagen">+</button>

      {/* Viewer de imagen */}
      {selected && (
        <ImageViewer
          image={selected}
          allImages={images}
          onClose={() => setSelected(null)}
          onSelect={setSelected}
        />
      )}

      {/* Modal de subida */}
      {showModal && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Subir imagen</h2>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>

            <form onSubmit={handleUpload} className="modal-body">
              {/* Zona de drop / preview */}
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
              <input
                id="file-input"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="file-input-hidden"
                onChange={handleFileChange}
                required
              />

              <input
                type="text"
                className="modal-input"
                placeholder="Título (opcional)"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              />
              <textarea
                className="modal-input modal-textarea"
                placeholder="Descripción (opcional)"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
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
                <button type="button" className="btn-nav btn-nav--ghost" onClick={closeModal}>
                  Cancelar
                </button>
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
