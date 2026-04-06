import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { orderApi } from '../../services/orderApi';
import { Order } from '../../types/order';

interface Props {
  onSelect: (id: number) => void;
  onCreate: () => void;
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'partially_shipped', label: 'Partially Shipped' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'cancelled', label: 'Cancelled' },
];

const SOURCE_OPTIONS = [
  { value: '', label: 'All Sources' },
  { value: 'manual', label: 'Manual' },
  { value: 'ebay', label: 'eBay' },
  { value: 'woocommerce', label: 'WooCommerce' },
];

function statusBadge(status: string) {
  const map: Record<string, { bg: string; label: string }> = {
    pending: { bg: 'bg-blue-100 text-blue-800', label: 'Pending' },
    partially_shipped: { bg: 'bg-amber-100 text-amber-800', label: 'Partially Shipped' },
    shipped: { bg: 'bg-green-100 text-green-800', label: 'Shipped' },
    cancelled: { bg: 'bg-gray-100 text-gray-600', label: 'Cancelled' },
  };
  const entry = map[status] ?? { bg: 'bg-gray-100 text-gray-600', label: status };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${entry.bg}`}>
      {entry.label}
    </span>
  );
}

function sourceBadge(source: string) {
  const map: Record<string, { bg: string; label: string }> = {
    manual: { bg: 'bg-gray-100 text-gray-700', label: 'Manual' },
    ebay: { bg: 'bg-yellow-100 text-yellow-800', label: 'eBay' },
    woocommerce: { bg: 'bg-purple-100 text-purple-800', label: 'WooCommerce' },
  };
  const entry = map[source] ?? { bg: 'bg-gray-100 text-gray-600', label: source };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${entry.bg}`}>
      {entry.label}
    </span>
  );
}

export default function OrderList({ onSelect, onCreate }: Props) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
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
  }, [statusFilter, sourceFilter]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['orders', debouncedSearch, statusFilter, sourceFilter, page],
    queryFn: () =>
      orderApi.list({
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        source: sourceFilter || undefined,
        page,
        limit: pageSize,
      }),
  });

  const syncMutation = useMutation({
    mutationFn: () => orderApi.sync(),
    onSuccess: (response) => {
      const msg = response?.data?.message ?? 'Sync complete';
      alert(msg);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error ?? err?.message;
      alert('Sync failed: ' + msg);
    },
  });

  const orders: Order[] = data?.data?.data ?? data?.data ?? [];
  const total: number = data?.data?.total ?? orders.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '\u2014';
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Orders</h1>
        <div className="flex gap-2">
          <button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            className="px-4 py-2 border border-gray-400 text-gray-700 rounded hover:bg-gray-100 text-sm font-medium disabled:opacity-50"
          >
            {syncMutation.isPending ? 'Syncing...' : 'Sync Orders'}
          </button>
          <button
            onClick={onCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
          >
            New Order
          </button>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by order number, external ID, or customer..."
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
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {SOURCE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading && (
        <div className="text-gray-500 py-8 text-center">Loading orders...</div>
      )}

      {isError && (
        <div className="text-red-600 py-8 text-center">
          Error loading orders: {(error as Error).message}
        </div>
      )}

      {!isLoading && !isError && (
        <>
          <div className="overflow-x-auto bg-white rounded shadow">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-600">Order Number</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Source</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Customer</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Order Date</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Ship Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No orders found.
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => onSelect(order.id)}
                      className="border-b hover:bg-blue-50 cursor-pointer"
                    >
                      <td className="px-4 py-3 font-mono text-gray-800">{order.order_number}</td>
                      <td className="px-4 py-3">{sourceBadge(order.source)}</td>
                      <td className="px-4 py-3 text-gray-800">{order.customer_name || '\u2014'}</td>
                      <td className="px-4 py-3">{statusBadge(order.status)}</td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(order.order_date)}</td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(order.ship_date)}</td>
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
