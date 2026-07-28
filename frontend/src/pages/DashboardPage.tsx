import { useCallback, useEffect, useState } from 'react';
import { toMessage } from '../api/client';
import {
  createVehicle,
  deleteVehicle,
  listVehicles,
  purchaseVehicle,
  restockVehicle,
  searchVehicles,
  updateVehicle,
} from '../api/vehicles';
import { Layout } from '../components/Layout';
import { SearchBar } from '../components/SearchBar';
import { VehicleCard } from '../components/VehicleCard';
import { VehicleFormModal } from '../components/VehicleFormModal';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import type { SearchFilters, Vehicle, VehicleInput } from '../types';

export const DashboardPage = () => {
  const { isAdmin } = useAuth();
  const { notify } = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      setVehicles(await listVehicles());
      setLoadError(null);
    } catch (error) {
      setLoadError(toMessage(error, 'Unable to load inventory'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSearch = async (filters: SearchFilters) => {
    setIsSearching(true);
    try {
      setVehicles(await searchVehicles(filters));
      setLoadError(null);
    } catch (error) {
      notify(toMessage(error, 'Search failed'), 'error');
    } finally {
      setIsSearching(false);
    }
  };

  const replaceVehicle = (updated: Vehicle) =>
    setVehicles((current) => current.map((v) => (v.id === updated.id ? updated : v)));

  const withBusy = async (id: string, action: () => Promise<void>) => {
    setBusyId(id);
    try {
      await action();
    } finally {
      setBusyId(null);
    }
  };

  const handlePurchase = (vehicle: Vehicle) =>
    withBusy(vehicle.id, async () => {
      try {
        replaceVehicle(await purchaseVehicle(vehicle.id));
        notify(`Purchased ${vehicle.make} ${vehicle.model}`);
      } catch (error) {
        notify(toMessage(error, 'Purchase failed'), 'error');
        void load();
      }
    });

  const handleRestock = (vehicle: Vehicle) =>
    withBusy(vehicle.id, async () => {
      try {
        replaceVehicle(await restockVehicle(vehicle.id));
        notify(`Restocked ${vehicle.make} ${vehicle.model}`);
      } catch (error) {
        notify(toMessage(error, 'Restock failed'), 'error');
      }
    });

  const handleDelete = async (vehicle: Vehicle) => {
    if (!window.confirm(`Delete ${vehicle.make} ${vehicle.model}?`)) return;
    try {
      await deleteVehicle(vehicle.id);
      setVehicles((current) => current.filter((v) => v.id !== vehicle.id));
      notify(`Deleted ${vehicle.make} ${vehicle.model}`);
    } catch (error) {
      notify(toMessage(error, 'Delete failed'), 'error');
    }
  };

  const handleSave = async (input: VehicleInput) => {
    try {
      if (editing) {
        replaceVehicle(await updateVehicle(editing.id, input));
        notify('Vehicle updated');
      } else {
        const created = await createVehicle(input);
        setVehicles((current) => [created, ...current]);
        notify('Vehicle added');
      }
      setIsFormOpen(false);
      setEditing(null);
    } catch (error) {
      notify(toMessage(error, 'Save failed'), 'error');
    }
  };

  return (
    <Layout>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Inventory</h1>
          <p className="mt-1 text-sm text-slate-600">
            {vehicles.length} vehicle{vehicles.length === 1 ? '' : 's'} on the lot
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setEditing(null);
              setIsFormOpen(true);
            }}
          >
            Add vehicle
          </button>
        )}
      </div>

      <div className="mt-6">
        <SearchBar onSearch={handleSearch} isSearching={isSearching} />
      </div>

      {isLoading && <p className="mt-10 text-center text-sm text-slate-500">Loading inventory…</p>}

      {loadError && !isLoading && (
        <p role="alert" className="mt-10 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {loadError}
        </p>
      )}

      {!isLoading && !loadError && vehicles.length === 0 && (
        <p className="mt-10 text-center text-sm text-slate-500">No vehicles match your search.</p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {!isLoading &&
          vehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              isAdmin={isAdmin}
              isBusy={busyId === vehicle.id}
              onPurchase={handlePurchase}
              onRestock={handleRestock}
              onDelete={handleDelete}
              onEdit={(target) => {
                setEditing(target);
                setIsFormOpen(true);
              }}
            />
          ))}
      </div>

      {isFormOpen && isAdmin && (
        <VehicleFormModal
          vehicle={editing}
          onSubmit={handleSave}
          onClose={() => {
            setIsFormOpen(false);
            setEditing(null);
          }}
        />
      )}
    </Layout>
  );
};
