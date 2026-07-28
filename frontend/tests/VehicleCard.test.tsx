import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { VehicleCard } from '../src/components/VehicleCard';
import type { Vehicle } from '../src/types';

const vehicle: Vehicle = {
  id: 'v1',
  make: 'Toyota',
  model: 'Corolla',
  category: 'sedan',
  price: 24999,
  quantity: 3,
};

const renderCard = (overrides: Partial<Vehicle> = {}, isAdmin = false) => {
  const onPurchase = vi.fn();
  const onEdit = vi.fn();
  const onDelete = vi.fn();
  const onRestock = vi.fn();

  render(
    <VehicleCard
      vehicle={{ ...vehicle, ...overrides }}
      isAdmin={isAdmin}
      onPurchase={onPurchase}
      onEdit={onEdit}
      onDelete={onDelete}
      onRestock={onRestock}
    />,
  );

  return { onPurchase, onEdit, onDelete, onRestock };
};

describe('VehicleCard', () => {
  it('shows the vehicle details and a live purchase button when in stock', async () => {
    const { onPurchase } = renderCard();

    expect(screen.getByText('Toyota Corolla')).toBeInTheDocument();
    expect(screen.getByText('$24,999')).toBeInTheDocument();
    expect(screen.getByText('3 in stock')).toBeInTheDocument();

    const button = screen.getByRole('button', { name: 'Purchase' });
    expect(button).toBeEnabled();

    await userEvent.click(button);
    expect(onPurchase).toHaveBeenCalledTimes(1);
  });

  it('disables the purchase button and shows Out of Stock when quantity is zero', () => {
    renderCard({ quantity: 0 });

    const button = screen.getByRole('button', { name: 'Out of Stock' });
    expect(button).toBeDisabled();
    expect(screen.getByText('Out of stock')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Purchase' })).not.toBeInTheDocument();
  });

  it('hides admin controls from non-admin users', () => {
    renderCard();

    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Restock' })).not.toBeInTheDocument();
  });

  it('renders admin controls and wires their handlers for admins', async () => {
    const { onEdit, onDelete, onRestock } = renderCard({}, true);

    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await userEvent.click(screen.getByRole('button', { name: 'Restock' }));

    expect(onEdit).toHaveBeenCalledWith(vehicle);
    expect(onDelete).toHaveBeenCalledWith(vehicle);
    expect(onRestock).toHaveBeenCalledWith(vehicle);
  });
});
