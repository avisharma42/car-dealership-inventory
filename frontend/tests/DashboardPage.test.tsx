import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DashboardPage } from '../src/pages/DashboardPage';
import { AuthContext, type AuthContextValue } from '../src/context/AuthContext';
import { ToastProvider } from '../src/hooks/useToast';
import type { User, Vehicle } from '../src/types';

const vehicles: Vehicle[] = [
  { id: 'v1', make: 'Toyota', model: 'Corolla', category: 'sedan', price: 24999, quantity: 2 },
  { id: 'v2', make: 'Honda', model: 'Civic', category: 'sedan', price: 22999, quantity: 0 },
];

const { listVehicles, purchaseVehicle, searchVehicles } = vi.hoisted(() => ({
  listVehicles: vi.fn(),
  purchaseVehicle: vi.fn(),
  searchVehicles: vi.fn(),
}));

vi.mock('../src/api/vehicles', () => ({
  listVehicles,
  purchaseVehicle,
  searchVehicles,
  createVehicle: vi.fn(),
  updateVehicle: vi.fn(),
  deleteVehicle: vi.fn(),
  restockVehicle: vi.fn(),
}));

const adminUser: User = { id: 'u1', name: 'Admin', email: 'admin@example.com', role: 'admin' };
const customer: User = { id: 'u2', name: 'Sam', email: 'sam@example.com', role: 'user' };

const renderDashboard = (user: User) => {
  const value: AuthContextValue = {
    user,
    token: 'token',
    isAdmin: user.role === 'admin',
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  };

  render(
    <MemoryRouter>
      <AuthContext.Provider value={value}>
        <ToastProvider>
          <DashboardPage />
        </ToastProvider>
      </AuthContext.Provider>
    </MemoryRouter>,
  );
};

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listVehicles.mockResolvedValue(vehicles);
  });

  it('shows a loading state and then the inventory', async () => {
    renderDashboard(customer);

    expect(screen.getByText('Loading inventory…')).toBeInTheDocument();
    expect(await screen.findByText('Toyota Corolla')).toBeInTheDocument();
    expect(screen.getByText('Honda Civic')).toBeInTheDocument();
  });

  it('hides admin actions from customers', async () => {
    renderDashboard(customer);
    await screen.findByText('Toyota Corolla');

    expect(screen.queryByRole('button', { name: 'Add vehicle' })).not.toBeInTheDocument();
  });

  it('shows the add vehicle action for admins', async () => {
    renderDashboard(adminUser);
    await screen.findByText('Toyota Corolla');

    expect(screen.getByRole('button', { name: 'Add vehicle' })).toBeInTheDocument();
  });

  it('updates the card quantity after a purchase', async () => {
    purchaseVehicle.mockResolvedValue({ ...vehicles[0], quantity: 1 });
    renderDashboard(customer);
    await screen.findByText('Toyota Corolla');

    await userEvent.click(screen.getAllByRole('button', { name: 'Purchase' })[0]);

    expect(purchaseVehicle).toHaveBeenCalledWith('v1');
    expect(await screen.findByText('1 in stock')).toBeInTheDocument();
  });

  it('shows an error toast when the purchase is rejected', async () => {
    purchaseVehicle.mockRejectedValue(new Error('Insufficient stock'));
    renderDashboard(customer);
    await screen.findByText('Toyota Corolla');

    await userEvent.click(screen.getAllByRole('button', { name: 'Purchase' })[0]);

    expect(await screen.findByRole('status')).toHaveTextContent('Insufficient stock');
  });

  it('queries the search endpoint with the submitted filters', async () => {
    searchVehicles.mockResolvedValue([vehicles[1]]);
    renderDashboard(customer);
    await screen.findByText('Toyota Corolla');

    await userEvent.type(screen.getByLabelText('Make'), 'Honda');
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));

    await waitFor(() => expect(searchVehicles).toHaveBeenCalled());
    expect(searchVehicles.mock.calls[0][0]).toMatchObject({ make: 'Honda' });
    expect(await screen.findByText('Honda Civic')).toBeInTheDocument();
    expect(screen.queryByText('Toyota Corolla')).not.toBeInTheDocument();
  });

  it('surfaces a load failure', async () => {
    listVehicles.mockRejectedValue(new Error('Unable to load inventory'));
    renderDashboard(customer);

    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load inventory');
  });
});
