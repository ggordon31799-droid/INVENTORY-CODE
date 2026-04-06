import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cycleCountApi } from '../../services/inventoryControlApi';
import { productApi } from '../../services/productApi';
import { Product } from '../../types/product';

type ScopeType = 'all' | 'category' | 'location' | 'custom';

interface Props {
  onSave: (id: number) => void;
  onCancel: () => void;
}

export default function CycleCountForm({ onSave, onCancel }: Props) {
  const queryClient = useQueryClient();
  const [scopeType, setScopeType] = useState<ScopeType>('all');
  const [scopeValue, setScopeValue] = useState('');
  const [countedBy, setCountedBy] = useState('admin');
  const [error, setError] = useState('');

  // Custom product selection
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const mutation = useMutation({
    mutationFn: (data: Record<string, any>) => cycleCountApi.create(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['cycleCounts'] });
      const id = res?.data?.id ?? res?.data?.data?.id;
      onSave(id);
    },
    onError: (err: any) => {
      setError(err?.response?.data?.error ?? err.message);
    },
  });

  const searchProducts = async (term: string) => {
    if (term.length < 1) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await productApi.list({ search: term, limit: 10 });
      const products: Product[] = res?.data?.data ?? res?.data ?? [];
      // filter out already selected
      const selectedIds = new Set(selectedProducts.map((p) => p.id));
      setSearchResults(products.filter((p) => !selectedIds.has(p.id)));
    } catch {
      // ignore
    }
  };

  const addProduct = (product: Product) => {
    setSelectedProducts((prev) => [...prev, product]);
    setSearchText('');
    setSearchResults([]);
    setShowDropdown(false);
  };

  const removeProduct = (id: number) => {
    setSelectedProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!countedBy.trim()) {
      setError('Counted By is required');
      return;
    }

    if ((scopeType === 'category' || scopeType === 'location') && !scopeValue.trim()) {
      setError(`Please enter a ${scopeType} value`);
      return;
    }

    if (scopeType === 'custom' && selectedProducts.length === 0) {
      setError('Please select at least one product');
      return;
    }

    const payload: Record<string, any> = {
      counted_by: countedBy.trim(),
    };

    if (scopeType === 'all') {
      payload.scope_type = 'all';
    } else if (scopeType === 'category') {
      payload.scope_type = 'category';
      payload.scope_value = scopeValue.trim();
    } else if (scopeType === 'location') {
      payload.scope_type = 'location';
      payload.scope_value = scopeValue.trim();
    } else {
      payload.scope_type = 'custom';
      payload.product_ids = selectedProducts.map((p) => p.id);
    }

    mutation.mutate(payload);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">New Cycle Count</h1>
        <button onClick={onCancel} className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-100">
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded shadow p-6 max-w-xl">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{error}</div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Scope</label>
          <div className="grid grid-cols-2 gap-2">
            {(['all', 'category', 'location', 'custom'] as ScopeType[]).map((s) => (
              <label key={s} className="flex items-center gap-2 text-sm cursor-pointer p-2 border rounded hover:bg-gray-50">
                <input
                  type="radio"
                  name="scope"
                  checked={scopeType === s}
                  onChange={() => { setScopeType(s); setScopeValue(''); setSelectedProducts([]); }}
                  className="text-blue-600"
                />
                {s === 'all' ? 'All Products' : s.charAt(0).toUpperCase() + s.slice(1)}
              </label>
            ))}
          </div>
        </div>

        {(scopeType === 'category' || scopeType === 'location') && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {scopeType === 'category' ? 'Category' : 'Location'} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={scopeValue}
              onChange={(e) => setScopeValue(e.target.value)}
              placeholder={scopeType === 'category' ? 'e.g. Electronics' : 'e.g. Warehouse-A'}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {scopeType === 'custom' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Products <span className="text-red-500">*</span>
            </label>
            <div className="relative mb-2">
              <input
                type="text"
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setShowDropdown(true);
                  searchProducts(e.target.value);
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Search to add products..."
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg max-h-40 overflow-y-auto">
                  {searchResults.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => addProduct(p)}
                      className="block w-full text-left px-3 py-2 text-sm hover:bg-blue-50"
                    >
                      <span className="font-mono">{p.sku}</span> — {p.product_name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedProducts.length > 0 && (
              <div className="space-y-1">
                {selectedProducts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 border rounded text-sm">
                    <span><span className="font-mono">{p.sku}</span> — {p.product_name}</span>
                    <button type="button" onClick={() => removeProduct(p.id)} className="text-xs text-red-600 hover:underline">remove</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Counted By <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={countedBy}
            onChange={(e) => setCountedBy(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
          >
            {mutation.isPending ? 'Creating...' : 'Start Count'}
          </button>
          <button type="button" onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-100">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
