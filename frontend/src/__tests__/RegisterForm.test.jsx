import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RegisterForm from '../components/RegisterForm';
import * as authApi from '../services/authApi';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../services/authApi');

function renderRegisterForm() {
  return render(
    <MemoryRouter>
      <RegisterForm />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('RegisterForm', () => {
  it('renderiza los campos username, email y password', () => {
    renderRegisterForm();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
  });

  it('redirige a /login tras registro exitoso', async () => {
    authApi.register.mockResolvedValueOnce({ message: 'Usuario registrado exitosamente' });

    renderRegisterForm();
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /registrarse/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('muestra error del servidor si el registro falla', async () => {
    authApi.register.mockRejectedValueOnce(new Error('El email ya está registrado'));

    renderRegisterForm();
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'dup@example.com' } });
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /registrarse/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('El email ya está registrado');
    });
  });

  it('deshabilita el botón mientras loading es true', async () => {
    let resolveRegister;
    authApi.register.mockReturnValueOnce(new Promise((res) => { resolveRegister = res; }));

    renderRegisterForm();
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /registrarse/i }));

    expect(screen.getByRole('button')).toBeDisabled();
    resolveRegister({ message: 'ok' });
  });

  it('muestra error de validación frontend sin llamar a la API', async () => {
    renderRegisterForm();
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'ab' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /registrarse/i }));

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(authApi.register).not.toHaveBeenCalled();
  });
});
