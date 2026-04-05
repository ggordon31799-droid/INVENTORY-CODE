import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productApi } from '../../services/productApi';
import { LedgerEntry } from '../../types/product';

interface Props {
  productId: number;
}

const EVENT_TYPES = [
  { value: '', label: 'All Events' },
  { value: 'receipt', label: 'Receipt' },
  { value: 'shipment', label: 'Shipment' },
  { value: 'manual_outbound', label: 'Manual Outbound' },
  { value: 'adjustment', label: 'Adjustment' },
  { value: 'cycle_count_adjustment', label: 'Cycle Count' },
];

export default function LedgerHistory({ productId }: Props) {
  const [page, setPage] = useState(1);
  const [eventType, setEventType] = useState('');
  const pageSize = 20;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['ledger', productId, page, eventType],
    queryFn: () =>
      productApi.getLedger(productId, {
        page,
        limit: pageSize,
        event_type: eventType || undefined,
      }),
  });

  const entries: LedgerEntry[] = data?.data?.data ?? data?.data ?? [];
  const total: number = data?.data?.total ?? entries.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800">Inventory Ledger</h3>
        <select
          value={eventType}
          onChange={(e) => {
            setEventType(e.target.value);
            setPage(1);
          }}
          className="px-2 py-1.5 border border-gray-300 rounded text-sm"
        >
          {EVENT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <p className="text-sm text-gray-500">Loading ledger...</p>}
      {isError && <p className="text-sm text-red-600">Failed to load ledger.</p>}

      {!isLoading && !isError && (
        <>
          {entries.length === 0 ? (
            <p className="text-sm text-gray-500">No inventory changes yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left">
                  <th className="px-3 py-2 font-medium text-gray-600">Date</th>
                  <th className="px-3 py-2 font-medium text-gray-600">Event Type</th>
                  <th className="px-3 py-2 font-medium text-gray-600 text-right">Qty Delta</th>
                  <th className="px-3 py-2 font-medium text-gray-600 text-right">Qty After</th>
                  <th className="px-3 py-2 font-medium text-gray-600">Source</th>
                  <th className="px-3 py-2 font-medium text-gray-600">Reference</th>
                  <th className="px-3 py-2 font-medium text-gray-600">Performed By</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-b">
                    <td className="px-3 py-2 text-gray-600">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2">{entry.event_type}</td>
                    <td className="px-3 py-2 text-right font-mono">
                      <span
                        className={
                          entry.qty_delta > 0
                            ? 'text-green-700'
                            : entry.qty_delta < 0
                            ? 'text-red-700'
                            : ''
                        }
                      >
                        {entry.qty_delta > 0 ? '+' : ''}
                        {entry.qty_delta}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-mono">{entry.qty_after}</td>
                    <td className="px-3 py-2 text-gray-600">
                      {entry.source_table}#{entry.source_id}
                    </td>
                    <td className="px-3 py-2 text-gray-600 font-mono">
                      {entry.reference_code ?? '\u2014'}
                    </td>
                    <td className="px-3 py-2 text-gray-600">{entry.performed_by}</td>
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
