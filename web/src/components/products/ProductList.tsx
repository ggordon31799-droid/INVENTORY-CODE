import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productApi } from '../../services/productApi';
import { Product } from '../../types/product';

interface Props {
  onSelect: (id: number) => void;
  onCreate: () => void;
}

export default function ProductList({ onSelect, onCreate }: Props) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['products', debouncedSearch, page],
    queryFn: () =>
      productApi.list({
        search: debouncedSearch || undefined,
        page,
        limit: pageSize,
      }),
  });

  const products: Product[] = data?.data?.data ?? data?.data ?? [];
  const total: number = data?.data?.total ?? products.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const formatCurrency = (value: string) => `$${parseFloat(value).toFixed(2)}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Products</h1>
        <button
          onClick={onCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
        >
          New Product
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by SKU, name, or barcode..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-3 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
      </div>

      {isLoading && (
        <div className="text-gray-500 py-8 text-center">Loading products...</div>
      )}

      {isError && (
        <div className="text-red-600 py-8 text-center">
          Error loading products: {(error as Error).message}
        </div>
      )}

      {!isLoading && !isError && (
        <>
          <div className="overflow-x-auto bg-white rounded shadow">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-600">SKU</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Product Name</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-right">Qty on Hand</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-right">Avg Cost</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-right">Total Value</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Location</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      No products found.
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr
                      key={product.id}
                      onClick={() => onSelect(product.id)}
                      className="border-b hover:bg-blue-50 cursor-pointer"
                    >
                      <td className="px-4 py-3 font-mono text-gray-800">{product.sku}</td>
                      <td className="px-4 py-3 text-gray-800">{product.product_name}</td>
                      <td className="px-4 py-3 text-right text-gray-800">{product.qty_on_hand}</td>
                      <td className="px-4 py-3 text-right text-gray-800">
                        {formatCurrency(product.weighted_avg_cost)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-800">
                        {formatCurrency(product.total_value)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{product.location ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            product.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {product.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages} ({total} total)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1 border rounded text-sm disabled:opacity-40 hover:bg-gray-100"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1 border rounded text-sm disabled:opacity-40 hover:bg-gray-100"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
