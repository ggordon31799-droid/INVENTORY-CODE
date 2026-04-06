import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { manualOutboundApi } from '../../services/manualOutboundApi';
import { DamagedReportEntry } from '../../types/manualOutbound';

export default function DamagedReport() {
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['damagedReport', page],
    queryFn: () => manualOutboundApi.damagedReport({ page, limit: pageSize }),
  });

  const entries: DamagedReportEntry[] = data?.data?.data ?? [];
  const total: number = data?.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const totalDamagedValue: number = data?.data?.total_damaged_value ?? 0;

  return (
    <div>
      {isLoading && <div className="text-gray-500 py-8 text-center">Loading...</div>}
      {isError && <div className="text-red-600 py-8 text-center">Error loading damaged report.</div>}

      {!isLoading && !isError && (
        <>
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
            <span className="text-sm font-medium text-red-800">
              Total Damaged Value: <span className="font-mono">${totalDamagedValue.toFixed(2)}</span>
            </span>
          </div>

          {entries.length === 0 ? (
            <p className="text-sm text-gray-500">No damaged inventory records.</p>
          ) : (
            <div className="overflow-x-auto bg-white rounded shadow">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left">
                    <th className="px-4 py-3 font-medium text-gray-600">Date</th>
                    <th className="px-4 py-3 font-medium text-gray-600">SKU</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Product Name</th>
                    <th className="px-4 py-3 font-medium text-gray-600 text-right">Qty</th>
                    <th className="px-4 py-3 font-medium text-gray-600 text-right">Unit Cost</th>
                    <th className="px-4 py-3 font-medium text-gray-600 text-right">Total Cost</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Reference</th>
                    <th className="px-4 py-3 font-medium text-gray-600">By</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id} className="border-b">
                      <td className="px-4 py-3 text-gray-600">{new Date(entry.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3 font-mono">{entry.sku}</td>
                      <td className="px-4 py-3">{entry.product_name}</td>
                      <td className="px-4 py-3 text-right font-mono text-red-700">{entry.qty}</td>
                      <td className="px-4 py-3 text-right font-mono">${parseFloat(entry.unit_cost_snapshot).toFixed(4)}</td>
                      <td className="px-4 py-3 text-right font-mono">${parseFloat(entry.total_cost).toFixed(2)}</td>
                      <td className="px-4 py-3 text-gray-600 font-mono">{entry.reference_number ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{entry.created_by}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
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
