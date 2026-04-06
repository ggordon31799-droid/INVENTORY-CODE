import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { cycleCountApi } from '../../services/inventoryControlApi';
import { CycleCount } from '../../types/inventoryControl';

interface Props {
  onSelect: (id: number) => void;
  onCreate: () => void;
}

export default function CycleCountList({ onSelect, onCreate }: Props) {
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['cycleCounts', statusFilter, page],
    queryFn: () =>
      cycleCountApi.list({
        status: statusFilter || undefined,
        page,
        limit: pageSize,
      }),
  });

  const entries: CycleCount[] = data?.data?.data ?? [];
  const total: number = data?.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const statusBadge = (status: string) => {
    if (status === 'in_progress') {
      return <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">In Progress</span>;
    }
    if (status === 'completed') {
      return <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Completed</span>;
    }
    return <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">{status}</span>;
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded text-sm"
        >
          <option value="">All Statuses</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        <div className="flex-1" />
        <button
          onClick={onCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
        >
          New Count
        </button>
      </div>

      {isLoading && <div className="text-gray-500 py-8 text-center">Loading...</div>}
      {isError && <div className="text-red-600 py-8 text-center">Error loading cycle counts.</div>}

      {!isLoading && !isError && (
        <>
          <div className="overflow-x-auto bg-white rounded shadow">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-600">ID</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Scope</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-right">Total SKUs</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-right">Discrepancies</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-right">Adjustments</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Counted By</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">No cycle counts found.</td></tr>
                ) : (
                  entries.map((cc) => (
                    <tr key={cc.id} onClick={() => onSelect(cc.id)} className="border-b hover:bg-blue-50 cursor-pointer">
                      <td className="px-4 py-3 font-mono text-gray-800">{cc.id}</td>
                      <td className="px-4 py-3">{statusBadge(cc.status)}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {cc.scope_type ? `${cc.scope_type}${cc.scope_value ? `: ${cc.scope_value}` : ''}` : 'All'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">{cc.total_skus}</td>
                      <td className="px-4 py-3 text-right font-mono">{cc.discrepancy_count}</td>
                      <td className="px-4 py-3 text-right font-mono">{cc.adjustments_made}</td>
                      <td className="px-4 py-3 text-gray-600">{cc.counted_by}</td>
                      <td className="px-4 py-3 text-gray-600">{new Date(cc.created_at).toLocaleDateString()}</td>
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
