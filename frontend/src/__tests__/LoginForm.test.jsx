import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginForm from '../components/LoginForm';
import { AuthContext } from '../context/AuthContext';
import * as authApi from '../services/authApi';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../services/authApi');

const mockLogin = vi.fn();

function renderLoginForm() {
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={{ login: mockLogin, isAuthenticated: false, loading: false }}>
        <LoginForm />
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('LoginForm', () => {
  it('renderiza los campos email y password', () => {
    renderLoginForm();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
  });

  it('redirige a /dashboard tras login exitoso', async () => {
    authApi.login.mockResolvedValueOnce({
      access_token: 'access123',
      refresh_token: 'refresh123',
    });

    renderLoginForm();
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('access123', 'refresh123');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('muestra error del servidor si el login falla sin limpiar campos', async () => {
    authApi.login.mockRejectedValueOnce(new Error('Credenciales inválidas'));

    renderLoginForm();
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Credenciales inválidas');
    });

    // Los campos no deben limpiarse
    expect(screen.getByLabelText(/email/i)).toHaveValue('test@example.com');
    expect(screen.getByLabelText(/contraseña/i)).toHaveValue('wrongpass');
  });

  it('deshabilita el botón mientras loading es true', async () => {
    let resolveLogin;
    authApi.login.mockReturnValueOnce(new Promise((res) => { resolveLogin = res; }));

    renderLoginForm();
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    expect(screen.getByRole('button')).toBeDisabled();
    resolveLogin({ access_token: 'a', refresh_token: 'r' });
  });

  it('muestra error de validación frontend sin llamar a la API', async () => {
    renderLoginForm();
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'not-an-email' } });
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(authApi.login).not.toHaveBeenCalled();
  });
});
