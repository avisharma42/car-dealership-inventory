import { useState, type FormEvent } from 'react';
import { VEHICLE_CATEGORIES, type Vehicle, type VehicleCategory, type VehicleInput } from '../types';

interface VehicleFormModalProps {
  vehicle: Vehicle | null;
  onClose: () => void;
  onSubmit: (input: VehicleInput) => Promise<void>;
}

interface FormState {
  make: string;
  model: string;
  category: VehicleCategory;
  price: string;
  quantity: string;
}

const toFormState = (vehicle: Vehicle | null): FormState => ({
  make: vehicle?.make ?? '',
  model: vehicle?.model ?? '',
  category: vehicle?.category ?? 'sedan',
  price: vehicle ? String(vehicle.price) : '',
  quantity: vehicle ? String(vehicle.quantity) : '0',
});

const validate = (form: FormState): Partial<Record<keyof FormState, string>> => {
  const errors: Partial<Record<keyof FormState, string>> = {};
  if (!form.make.trim()) errors.make = 'Make is required';
  if (!form.model.trim()) errors.model = 'Model is required';
  if (form.price === '' || Number(form.price) < 0 || Number.isNaN(Number(form.price))) {
    errors.price = 'Price must be zero or greater';
  }
  if (!Number.isInteger(Number(form.quantity)) || Number(form.quantity) < 0) {
    errors.quantity = 'Quantity must be a whole number of zero or more';
  }
  return errors;
};

export const VehicleFormModal = ({ vehicle, onClose, onSubmit }: VehicleFormModalProps) => {
  const [form, setForm] = useState<FormState>(() => toFormState(vehicle));
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [isSaving, setIsSaving] = useState(false);

  const update = (key: keyof FormState, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSaving(true);
    try {
      await onSubmit({
        make: form.make.trim(),
        model: form.model.trim(),
        category: form.category,
        price: Number(form.price),
        quantity: Number(form.quantity),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="card w-full max-w-lg p-6" role="dialog" aria-modal="true" aria-label={vehicle ? 'Edit vehicle' : 'Add vehicle'}>
        <h2 className="text-xl font-semibold text-slate-900">{vehicle ? 'Edit vehicle' : 'Add vehicle'}</h2>

        <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit} noValidate>
          <div>
            <label className="label" htmlFor="vehicle-make">
              Make
            </label>
            <input id="vehicle-make" className="input" value={form.make} onChange={(e) => update('make', e.target.value)} />
            {errors.make && <p className="mt-1 text-sm text-red-600">{errors.make}</p>}
          </div>

          <div>
            <label className="label" htmlFor="vehicle-model">
              Model
            </label>
            <input id="vehicle-model" className="input" value={form.model} onChange={(e) => update('model', e.target.value)} />
            {errors.model && <p className="mt-1 text-sm text-red-600">{errors.model}</p>}
          </div>

          <div>
            <label className="label" htmlFor="vehicle-category">
              Category
            </label>
            <select
              id="vehicle-category"
              className="input"
              value={form.category}
              onChange={(e) => update('category', e.target.value as VehicleCategory)}
            >
              {VEHICLE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="vehicle-price">
              Price (USD)
            </label>
            <input
              id="vehicle-price"
              className="input"
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => update('price', e.target.value)}
            />
            {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
          </div>

          <div>
            <label className="label" htmlFor="vehicle-quantity">
              Quantity
            </label>
            <input
              id="vehicle-quantity"
              className="input"
              type="number"
              min="0"
              value={form.quantity}
              onChange={(e) => update('quantity', e.target.value)}
            />
            {errors.quantity && <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>}
          </div>

          <div className="flex items-end justify-end gap-2 sm:col-span-2">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save vehicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
