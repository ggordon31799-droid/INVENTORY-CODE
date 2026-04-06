import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { manualOutboundApi } from '../../services/manualOutboundApi';
import { ManualOutbound } from '../../types/manualOutbound';

const TYPE_LABELS: Record<string, string> = {
  amazon_fba: 'Amazon FBA',
  amazon_order: 'Amazon Order',
  damaged: 'Damaged',
  internal_use: 'Internal Use',
  sample: 'Sample',
  other: 'Other',
};

interface Props {
  onSelect: (id: number) => void;
}

export default function OutboundList({ onSelect }: Props) {
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['manualOutbound', typeFilter, page],
    queryFn: () =>
      manualOutboundApi.list({
        outbound_type: typeFilter || undefined,
        page,
        limit: pageSize,
      }),
  });

  const entries: ManualOutbound[] = data?.data?.data ?? [];
  const total: number = data?.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded text-sm"
        >
          <option value="">All Types</option>
          {Object.entries(TYPE_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </div>

      {isLoading && <div className="text-gray-500 py-8 text-center">Loading...</div>}
      {isError && <div className="text-red-600 py-8 text-center">Error loading outbound records.</div>}

      {!isLoading && !isError && (
        <>
          <div className="overflow-x-auto bg-white rounded shadow">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-600">ID</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Type</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Reference</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Created By</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No outbound records found.</td></tr>
                ) : (
                  entries.map((entry) => (
                    <tr key={entry.id} onClick={() => onSelect(entry.id)} className="border-b hover:bg-blue-50 cursor-pointer">
                      <td className="px-4 py-3 font-mono text-gray-800">{entry.id}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          entry.outbound_type === 'damaged' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {TYPE_LABELS[entry.outbound_type] ?? entry.outbound_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 font-mono">{entry.reference_number ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{entry.created_by}</td>
                      <td className="px-4 py-3 text-gray-600">{new Date(entry.created_at).toLocaleDateString()}</td>
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
