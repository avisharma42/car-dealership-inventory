import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SearchBar } from '../src/components/SearchBar';

describe('SearchBar', () => {
  it('passes the entered filters to onSearch', async () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    await userEvent.type(screen.getByLabelText('Make'), 'Toyota');
    await userEvent.selectOptions(screen.getByLabelText('Category'), 'suv');
    await userEvent.type(screen.getByLabelText('Min price'), '20000');
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));

    expect(onSearch).toHaveBeenCalledWith({
      make: 'Toyota',
      model: '',
      category: 'suv',
      minPrice: '20000',
      maxPrice: '',
    });
  });

  it('blocks a search where min price exceeds max price', async () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    await userEvent.type(screen.getByLabelText('Min price'), '50000');
    await userEvent.type(screen.getByLabelText('Max price'), '10000');
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Min price cannot be greater than max price',
    );
    expect(onSearch).not.toHaveBeenCalled();
  });

  it('clears the filters on reset', async () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    await userEvent.type(screen.getByLabelText('Make'), 'Ford');
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }));

    expect(screen.getByLabelText('Make')).toHaveValue('');
    expect(onSearch).toHaveBeenCalledWith({
      make: '',
      model: '',
      category: '',
      minPrice: '',
      maxPrice: '',
    });
  });
});
