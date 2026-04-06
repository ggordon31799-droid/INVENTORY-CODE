import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adjustmentApi } from '../../services/inventoryControlApi';
import { Adjustment } from '../../types/inventoryControl';

const REASON_LABELS: Record<string, string> = {
  count_correction: 'Count Correction',
  write_off: 'Write-Off',
  found_inventory: 'Found Inventory',
  shipment_correction: 'Shipment Correction',
  data_fix: 'Data Fix',
  other: 'Other',
};

interface Props {
  onSelect: (id: number) => void;
}

export default function AdjustmentList({ onSelect }: Props) {
  const [reasonFilter, setReasonFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['adjustments', reasonFilter, page],
    queryFn: () =>
      adjustmentApi.list({
        reason: reasonFilter || undefined,
        page,
        limit: pageSize,
      }),
  });

  const entries: Adjustment[] = data?.data?.data ?? [];
  const total: number = data?.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <select
          value={reasonFilter}
          onChange={(e) => { setReasonFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded text-sm"
        >
          <option value="">All Reasons</option>
          {Object.entries(REASON_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </div>

      {isLoading && <div className="text-gray-500 py-8 text-center">Loading...</div>}
      {isError && <div className="text-red-600 py-8 text-center">Error loading adjustments.</div>}

      {!isLoading && !isError && (
        <>
          <div className="overflow-x-auto bg-white rounded shadow">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-600">Date</th>
                  <th className="px-4 py-3 font-medium text-gray-600">SKU</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Product</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-right">Previous</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-right">New</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-right">Delta</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Reason</th>
                  <th className="px-4 py-3 font-medium text-gray-600">By</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">No adjustments found.</td></tr>
                ) : (
                  entries.map((adj) => (
                    <tr key={adj.id} onClick={() => onSelect(adj.id)} className="border-b hover:bg-blue-50 cursor-pointer">
                      <td className="px-4 py-3 text-gray-600">{new Date(adj.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3 font-mono">{adj.sku ?? '—'}</td>
                      <td className="px-4 py-3">{adj.product_name ?? '—'}</td>
                      <td className="px-4 py-3 text-right font-mono">{adj.previous_qty}</td>
                      <td className="px-4 py-3 text-right font-mono">{adj.new_qty}</td>
                      <td className={`px-4 py-3 text-right font-mono font-semibold ${
                        adj.qty_delta > 0 ? 'text-green-700' : adj.qty_delta < 0 ? 'text-red-700' : 'text-gray-600'
                      }`}>
                        {adj.qty_delta > 0 ? '+' : ''}{adj.qty_delta}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                          {REASON_LABELS[adj.reason] ?? adj.reason}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{adj.adjusted_by}</td>
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
