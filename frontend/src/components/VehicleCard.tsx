import type { Vehicle } from '../types';

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

interface VehicleCardProps {
  vehicle: Vehicle;
  isAdmin: boolean;
  isBusy?: boolean;
  onPurchase: (vehicle: Vehicle) => void;
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (vehicle: Vehicle) => void;
  onRestock: (vehicle: Vehicle) => void;
}

export const VehicleCard = ({
  vehicle,
  isAdmin,
  isBusy = false,
  onPurchase,
  onEdit,
  onDelete,
  onRestock,
}: VehicleCardProps) => {
  const outOfStock = vehicle.quantity === 0;

  return (
    <article className="card flex flex-col gap-4 p-5" data-testid={`vehicle-${vehicle.id}`}>
      <header className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            {vehicle.make} {vehicle.model}
          </h3>
          <p className="mt-0.5 text-sm uppercase tracking-wide text-slate-500">{vehicle.category}</p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            outOfStock ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-700'
          }`}
        >
          {outOfStock ? 'Out of stock' : `${vehicle.quantity} in stock`}
        </span>
      </header>

      <p className="text-2xl font-bold text-slate-900">{currency.format(vehicle.price)}</p>

      <div className="mt-auto flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-primary flex-1"
          disabled={outOfStock || isBusy}
          onClick={() => onPurchase(vehicle)}
        >
          {outOfStock ? 'Out of Stock' : 'Purchase'}
        </button>

        {isAdmin && (
          <>
            <button type="button" className="btn-secondary" onClick={() => onRestock(vehicle)} disabled={isBusy}>
              Restock
            </button>
            <button type="button" className="btn-secondary" onClick={() => onEdit(vehicle)}>
              Edit
            </button>
            <button type="button" className="btn-danger" onClick={() => onDelete(vehicle)}>
              Delete
            </button>
          </>
        )}
      </div>
    </article>
  );
};
