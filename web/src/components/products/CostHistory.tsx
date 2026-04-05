import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productApi } from '../../services/productApi';
import { CostHistoryEntry } from '../../types/product';

interface Props {
  productId: number;
}

export default function CostHistory({ productId }: Props) {
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['costHistory', productId, page],
    queryFn: () => productApi.getCostHistory(productId, { page, limit: pageSize }),
  });

  const entries: CostHistoryEntry[] = data?.data?.data ?? data?.data ?? [];
  const total: number = data?.data?.total ?? entries.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const formatCurrency = (value: string) => `$${parseFloat(value).toFixed(4)}`;

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Cost History</h3>

      {isLoading && <p className="text-sm text-gray-500">Loading cost history...</p>}
      {isError && <p className="text-sm text-red-600">Failed to load cost history.</p>}

      {!isLoading && !isError && (
        <>
          {entries.length === 0 ? (
            <p className="text-sm text-gray-500">No cost history yet. Cost data appears after inventory is received against a purchase order.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left">
                  <th className="px-3 py-2 font-medium text-gray-600">Date</th>
                  <th className="px-3 py-2 font-medium text-gray-600">PO Number</th>
                  <th className="px-3 py-2 font-medium text-gray-600">Supplier</th>
                  <th className="px-3 py-2 font-medium text-gray-600 text-right">Qty Received</th>
                  <th className="px-3 py-2 font-medium text-gray-600 text-right">Unit Cost</th>
                  <th className="px-3 py-2 font-medium text-gray-600">Received By</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-b">
                    <td className="px-3 py-2 text-gray-600">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2 font-mono">{entry.po_number}</td>
                    <td className="px-3 py-2 text-gray-600">{entry.supplier}</td>
                    <td className="px-3 py-2 text-right font-mono text-green-700">
                      +{entry.received_qty}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      {formatCurrency(entry.unit_cost)}
                    </td>
                    <td className="px-3 py-2 text-gray-600">{entry.received_by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-gray-500">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-2 py-1 border rounded text-xs disabled:opacity-40 hover:bg-gray-100"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-2 py-1 border rounded text-xs disabled:opacity-40 hover:bg-gray-100"
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
