import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { transferApi } from '../../services/inventoryControlApi';
import { Transfer } from '../../types/inventoryControl';

export default function TransferList() {
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['transfers', page],
    queryFn: () =>
      transferApi.list({
        page,
        limit: pageSize,
      }),
  });

  const entries: Transfer[] = data?.data?.data ?? [];
  const total: number = data?.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      {isLoading && <div className="text-gray-500 py-8 text-center">Loading...</div>}
      {isError && <div className="text-red-600 py-8 text-center">Error loading transfers.</div>}

      {!isLoading && !isError && (
        <>
          <div className="overflow-x-auto bg-white rounded shadow">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-600">Date</th>
                  <th className="px-4 py-3 font-medium text-gray-600">SKU</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Product</th>
                  <th className="px-4 py-3 font-medium text-gray-600">From</th>
                  <th className="px-4 py-3 font-medium text-gray-600">To</th>
                  <th className="px-4 py-3 font-medium text-gray-600">By</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No transfers found.</td></tr>
                ) : (
                  entries.map((t) => (
                    <tr key={t.id} className="border-b">
                      <td className="px-4 py-3 text-gray-600">{new Date(t.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3 font-mono">{t.sku ?? '—'}</td>
                      <td className="px-4 py-3">{t.product_name ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{t.from_location ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{t.to_location}</td>
                      <td className="px-4 py-3 text-gray-600">{t.transferred_by}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-gray-600">Page {page} of {totalPages} ({total} total)</span>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1 border rounded text-sm disabled:opacity-40 hover:bg-gray-100">Previous</button>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1 border rounded text-sm disabled:opacity-40 hover:bg-gray-100">Next</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
