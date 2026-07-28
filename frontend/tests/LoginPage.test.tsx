import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { LoginPage } from '../src/pages/LoginPage';
import { AuthContext, type AuthContextValue } from '../src/context/AuthContext';

const renderLogin = (login: AuthContextValue['login']) => {
  const value: AuthContextValue = {
    user: null,
    token: null,
    isAdmin: false,
    login,
    register: vi.fn(),
    logout: vi.fn(),
  };

  render(
    <MemoryRouter>
      <AuthContext.Provider value={value}>
        <LoginPage />
      </AuthContext.Provider>
    </MemoryRouter>,
  );
};

describe('LoginPage', () => {
  it('shows client-side validation errors and does not call the API', async () => {
    const login = vi.fn();
    renderLogin(login);

    await userEvent.type(screen.getByLabelText('Email'), 'not-an-email');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it('submits valid credentials', async () => {
    const login = vi.fn().mockResolvedValue(undefined);
    renderLogin(login);

    await userEvent.type(screen.getByLabelText('Email'), 'ada@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'sup3rsecret');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(login).toHaveBeenCalledWith('ada@example.com', 'sup3rsecret');
  });

  it('surfaces the API error message when sign in fails', async () => {
    const login = vi.fn().mockRejectedValue(new Error('Invalid credentials'));
    renderLogin(login);

    await userEvent.type(screen.getByLabelText('Email'), 'ada@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'wrong-password');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid credentials');
  });
});
