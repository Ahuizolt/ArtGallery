import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register as apiRegister } from '../services/authApi';

function validate(username, email, password) {
  if (!username || username.trim().length < 3 || username.trim().length > 30)
    return 'El username debe tener entre 3 y 30 caracteres';
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
    return 'El email debe tener un formato válido';
  if (!password || password.length < 6)
    return 'La contraseña debe tener al menos 6 caracteres';
  return null;
}

export default function RegisterForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const err = validate(form.username, form.email, form.password);
    if (err) { setError(err); return; }
    setLoading(true);
    try {
      await apiRegister(form.username, form.email, form.password);
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <img src="/artgallery_icono.png" alt="Logo" />
        </div>
        <h2>Crea una cuenta</h2>
        <p className="auth-subtitle">Descubre y guarda ideas que te inspiran</p>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="username">Usuario</label>
            <input id="username" name="username" type="text" placeholder="Tu nombre de usuario"
              value={form.username} onChange={handleChange} autoComplete="username" />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" placeholder="tu@email.com"
              value={form.email} onChange={handleChange} autoComplete="email" />
          </div>
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input id="password" name="password" type="password" placeholder="Mínimo 6 caracteres"
              value={form.password} onChange={handleChange} autoComplete="new-password" />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creando cuenta...' : 'Continuar'}
          </button>
        </form>
        <div className="auth-divider">o</div>
        <p className="auth-footer">¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
      </div>
    </div>
  );
}
