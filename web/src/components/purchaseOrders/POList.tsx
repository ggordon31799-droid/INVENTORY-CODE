import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { purchaseOrderApi } from '../../services/purchaseOrderApi';
import { PurchaseOrder } from '../../types/purchaseOrder';

interface Props {
  onSelect: (id: number) => void;
  onCreate: () => void;
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'open', label: 'Open' },
  { value: 'partially_received', label: 'Partially Received' },
  { value: 'fully_received', label: 'Fully Received' },
  { value: 'closed', label: 'Closed' },
];

function statusBadge(status: string) {
  const map: Record<string, { bg: string; label: string }> = {
    open: { bg: 'bg-blue-100 text-blue-800', label: 'Open' },
    partially_received: { bg: 'bg-amber-100 text-amber-800', label: 'Partially Received' },
    fully_received: { bg: 'bg-green-100 text-green-800', label: 'Fully Received' },
    closed: { bg: 'bg-gray-100 text-gray-600', label: 'Closed' },
  };
  const entry = map[status] ?? { bg: 'bg-gray-100 text-gray-600', label: status };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${entry.bg}`}>
      {entry.label}
    </span>
  );
}

export default function POList({ onSelect, onCreate }: Props) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['purchaseOrders', debouncedSearch, statusFilter, page],
    queryFn: () =>
      purchaseOrderApi.list({
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        page,
        limit: pageSize,
      }),
  });

  const orders: PurchaseOrder[] = data?.data?.data ?? data?.data ?? [];
  const total: number = data?.data?.total ?? orders.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '\u2014';
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Purchase Orders</h1>
        <button
          onClick={onCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
        >
          New Purchase Order
        </button>
      </div>

      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by PO number or supplier..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-3 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading && (
        <div className="text-gray-500 py-8 text-center">Loading purchase orders...</div>
      )}

      {isError && (
        <div className="text-red-600 py-8 text-center">
          Error loading purchase orders: {(error as Error).message}
        </div>
      )}

      {!isLoading && !isError && (
        <>
          <div className="overflow-x-auto bg-white rounded shadow">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-600">PO Number</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Supplier</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Expected Date</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Created Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      No purchase orders found.
                    </td>
                  </tr>
                ) : (
                  orders.map((po) => (
                    <tr
                      key={po.id}
                      onClick={() => onSelect(po.id)}
                      className="border-b hover:bg-blue-50 cursor-pointer"
                    >
                      <td className="px-4 py-3 font-mono text-gray-800">{po.po_number}</td>
                      <td className="px-4 py-3 text-gray-800">{po.supplier}</td>
                      <td className="px-4 py-3">{statusBadge(po.status)}</td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(po.expected_date)}</td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(po.created_at)}</td>
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
