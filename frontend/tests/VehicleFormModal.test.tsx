import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { VehicleFormModal } from '../src/components/VehicleFormModal';
import type { Vehicle } from '../src/types';

const existing: Vehicle = {
  id: 'v1',
  make: 'Ford',
  model: 'F-150',
  category: 'truck',
  price: 45000,
  quantity: 2,
};

describe('VehicleFormModal', () => {
  it('shows validation errors and does not submit an empty form', async () => {
    const onSubmit = vi.fn();
    render(<VehicleFormModal vehicle={null} onSubmit={onSubmit} onClose={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Save vehicle' }));

    expect(await screen.findByText('Make is required')).toBeInTheDocument();
    expect(screen.getByText('Model is required')).toBeInTheDocument();
    expect(screen.getByText('Price must be zero or greater')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits normalized values for a valid form', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<VehicleFormModal vehicle={null} onSubmit={onSubmit} onClose={vi.fn()} />);

    await userEvent.type(screen.getByLabelText('Make'), '  Honda  ');
    await userEvent.type(screen.getByLabelText('Model'), 'Civic');
    await userEvent.selectOptions(screen.getByLabelText('Category'), 'sedan');
    await userEvent.type(screen.getByLabelText('Price (USD)'), '22999');
    await userEvent.clear(screen.getByLabelText('Quantity'));
    await userEvent.type(screen.getByLabelText('Quantity'), '4');

    await userEvent.click(screen.getByRole('button', { name: 'Save vehicle' }));

    expect(onSubmit).toHaveBeenCalledWith({
      make: 'Honda',
      model: 'Civic',
      category: 'sedan',
      price: 22999,
      quantity: 4,
    });
  });

  it('prefills the form when editing an existing vehicle', () => {
    render(<VehicleFormModal vehicle={existing} onSubmit={vi.fn()} onClose={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Edit vehicle' })).toBeInTheDocument();
    expect(screen.getByLabelText('Make')).toHaveValue('Ford');
    expect(screen.getByLabelText('Price (USD)')).toHaveValue(45000);
  });

  it('rejects a negative price', async () => {
    const onSubmit = vi.fn();
    render(<VehicleFormModal vehicle={existing} onSubmit={onSubmit} onClose={vi.fn()} />);

    await userEvent.clear(screen.getByLabelText('Price (USD)'));
    await userEvent.type(screen.getByLabelText('Price (USD)'), '-100');
    await userEvent.click(screen.getByRole('button', { name: 'Save vehicle' }));

    expect(await screen.findByText('Price must be zero or greater')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
