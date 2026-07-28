import { useState, type FormEvent } from 'react';
import { VEHICLE_CATEGORIES, type SearchFilters, type VehicleCategory } from '../types';

const EMPTY: SearchFilters = { make: '', model: '', category: '', minPrice: '', maxPrice: '' };

interface SearchBarProps {
  onSearch: (filters: SearchFilters) => void;
  isSearching?: boolean;
}

export const SearchBar = ({ onSearch, isSearching = false }: SearchBarProps) => {
  const [filters, setFilters] = useState<SearchFilters>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  const update = (key: keyof SearchFilters, value: string) =>
    setFilters((current) => ({ ...current, [key]: value }));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const min = Number(filters.minPrice);
    const max = Number(filters.maxPrice);

    if (filters.minPrice && filters.maxPrice && min > max) {
      setError('Min price cannot be greater than max price');
      return;
    }

    setError(null);
    onSearch(filters);
  };

  const handleReset = () => {
    setFilters(EMPTY);
    setError(null);
    onSearch(EMPTY);
  };

  return (
    <form onSubmit={handleSubmit} className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6" aria-label="Search vehicles">
      <div className="lg:col-span-1">
        <label className="label" htmlFor="filter-make">
          Make
        </label>
        <input
          id="filter-make"
          className="input"
          value={filters.make}
          placeholder="Toyota"
          onChange={(e) => update('make', e.target.value)}
        />
      </div>

      <div className="lg:col-span-1">
        <label className="label" htmlFor="filter-model">
          Model
        </label>
        <input
          id="filter-model"
          className="input"
          value={filters.model}
          placeholder="Corolla"
          onChange={(e) => update('model', e.target.value)}
        />
      </div>

      <div className="lg:col-span-1">
        <label className="label" htmlFor="filter-category">
          Category
        </label>
        <select
          id="filter-category"
          className="input"
          value={filters.category}
          onChange={(e) => update('category', e.target.value as VehicleCategory | '')}
        >
          <option value="">All categories</option>
          {VEHICLE_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div className="lg:col-span-1">
        <label className="label" htmlFor="filter-min-price">
          Min price
        </label>
        <input
          id="filter-min-price"
          className="input"
          type="number"
          min="0"
          value={filters.minPrice}
          onChange={(e) => update('minPrice', e.target.value)}
        />
      </div>

      <div className="lg:col-span-1">
        <label className="label" htmlFor="filter-max-price">
          Max price
        </label>
        <input
          id="filter-max-price"
          className="input"
          type="number"
          min="0"
          value={filters.maxPrice}
          onChange={(e) => update('maxPrice', e.target.value)}
        />
      </div>

      <div className="flex items-end gap-2 lg:col-span-1">
        <button type="submit" className="btn-primary flex-1" disabled={isSearching}>
          {isSearching ? 'Searching…' : 'Search'}
        </button>
        <button type="button" className="btn-secondary" onClick={handleReset}>
          Reset
        </button>
      </div>

      {error && (
        <p role="alert" className="text-sm font-medium text-red-600 sm:col-span-2 lg:col-span-6">
          {error}
        </p>
      )}
    </form>
  );
};
