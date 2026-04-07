import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { AuthProvider, AuthContext } from '../context/AuthContext';
import * as authApi from '../services/authApi';

vi.mock('../services/authApi');

function TestConsumer() {
  return (
    <AuthContext.Consumer>
      {(ctx) => (
        <div>
          <span data-testid="authenticated">{String(ctx.isAuthenticated)}</span>
          <span data-testid="token">{ctx.accessToken || 'null'}</span>
          <button onClick={() => ctx.login('access123', 'refresh123')}>Login</button>
          <button onClick={() => ctx.logout()}>Logout</button>
        </div>
      )}
    </AuthContext.Consumer>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

describe('AuthContext', () => {
  it('inicia con isAuthenticated false si no hay refresh_token en localStorage', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    });
  });

  it('login guarda refresh_token en localStorage y actualiza estado', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await act(async () => {
      screen.getByText('Login').click();
    });

    expect(localStorage.getItem('refresh_token')).toBe('refresh123');
    expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    expect(screen.getByTestId('token')).toHaveTextContent('access123');
  });

  it('logout limpia localStorage y restablece estado', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await act(async () => {
      screen.getByText('Login').click();
    });

    await act(async () => {
      screen.getByText('Logout').click();
    });

    expect(localStorage.getItem('refresh_token')).toBeNull();
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('token')).toHaveTextContent('null');
  });

  it('restaura sesión al inicializar si hay refresh_token en localStorage', async () => {
    localStorage.setItem('refresh_token', 'stored_refresh');
    authApi.refresh.mockResolvedValueOnce({ access_token: 'new_access' });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      expect(screen.getByTestId('token')).toHaveTextContent('new_access');
    });
  });

  it('llama logout si el refresh_token en localStorage es inválido al inicializar', async () => {
    localStorage.setItem('refresh_token', 'invalid_token');
    authApi.refresh.mockRejectedValueOnce(new Error('Refresh token inválido o expirado'));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      expect(localStorage.getItem('refresh_token')).toBeNull();
    });
  });
});
