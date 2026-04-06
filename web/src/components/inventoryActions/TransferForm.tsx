import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { transferApi } from '../../services/inventoryControlApi';
import { productApi } from '../../services/productApi';
import { Product } from '../../types/product';

interface Props {
  onComplete: () => void;
  onCancel: () => void;
}

export default function TransferForm({ onComplete, onCancel }: Props) {
  const queryClient = useQueryClient();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [toLocation, setToLocation] = useState('');
  const [transferredBy, setTransferredBy] = useState('admin');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (data: Record<string, any>) => transferApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      onComplete();
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
      const products = res?.data?.data ?? res?.data ?? [];
      setSearchResults(products);
    } catch {
      // ignore
    }
  };

  const selectProduct = (product: Product) => {
    setSelectedProduct(product);
    setSearchText('');
    setSearchResults([]);
    setShowDropdown(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedProduct) {
      setError('Please select a product');
      return;
    }
    if (!toLocation.trim()) {
      setError('New location is required');
      return;
    }
    if (!transferredBy.trim()) {
      setError('Transferred By is required');
      return;
    }

    mutation.mutate({
      product_id: selectedProduct.id,
      to_location: toLocation.trim(),
      transferred_by: transferredBy.trim(),
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Transfer Product</h1>
        <button onClick={onCancel} className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-100">
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded shadow p-6 max-w-xl">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{error}</div>
        )}

        {/* Product search */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Product <span className="text-red-500">*</span>
          </label>
          {selectedProduct ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-900">
                <span className="font-mono">{selectedProduct.sku}</span> — {selectedProduct.product_name}
              </span>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="text-xs text-red-600 hover:underline"
              >
                clear
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                type="text"
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setShowDropdown(true);
                  searchProducts(e.target.value);
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Search SKU or name..."
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg max-h-40 overflow-y-auto">
                  {searchResults.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => selectProduct(p)}
                      className="block w-full text-left px-3 py-2 text-sm hover:bg-blue-50"
                    >
                      <span className="font-mono">{p.sku}</span> — {p.product_name}
                      <span className="text-gray-500 ml-2">(qty: {p.qty_on_hand})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {selectedProduct && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
            Current Location: <span className="font-mono font-semibold">{selectedProduct.location ?? 'Not set'}</span>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            New Location <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={toLocation}
            onChange={(e) => setToLocation(e.target.value)}
            placeholder="e.g. Warehouse-B, Shelf-3A"
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Transferred By <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={transferredBy}
            onChange={(e) => setTransferredBy(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
          >
            {mutation.isPending ? 'Transferring...' : 'Confirm Transfer'}
          </button>
          <button type="button" onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-100">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
