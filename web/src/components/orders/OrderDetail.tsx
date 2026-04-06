import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderApi } from '../../services/orderApi';
import { productApi } from '../../services/productApi';
import { Order, OrderLineItem } from '../../types/order';
import { Product } from '../../types/product';
import ShipForm from './ShipForm';
import ShipmentHistory from './ShipmentHistory';

interface Props {
  orderId: number;
  onBack: () => void;
}

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

function lineStatusBadge(status: string) {
  const map: Record<string, { bg: string; label: string }> = {
    pending: { bg: 'bg-blue-100 text-blue-800', label: 'Pending' },
    partial: { bg: 'bg-amber-100 text-amber-800', label: 'Partial' },
    complete: { bg: 'bg-green-100 text-green-800', label: 'Complete' },
  };
  const entry = map[status] ?? { bg: 'bg-gray-100 text-gray-600', label: status };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${entry.bg}`}>
      {entry.label}
    </span>
  );
}

export default function OrderDetail({ orderId, onBack }: Props) {
  const queryClient = useQueryClient();
  const [showShipForm, setShowShipForm] = useState(false);
  const [resolvingLineId, setResolvingLineId] = useState<number | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => orderApi.get(orderId),
  });

  const order: Order | undefined = data?.data?.data ?? data?.data;

  const cancelMutation = useMutation({
    mutationFn: () => orderApi.cancel(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error ?? err?.message;
      alert(msg);
    },
  });

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '\u2014';
    return new Date(dateStr).toLocaleDateString();
  };

  if (isLoading) {
    return <div className="text-gray-500 py-8 text-center">Loading order...</div>;
  }

  if (isError) {
    return (
      <div>
        <button
          onClick={onBack}
          className="mb-4 px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-100"
        >
          &larr; Back to Orders
        </button>
        <div className="text-red-600 py-8 text-center">
          Error loading order: {(error as Error).message}
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div>
        <button
          onClick={onBack}
          className="mb-4 px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-100"
        >
          &larr; Back to Orders
        </button>
        <div className="text-gray-500 py-8 text-center">Order not found.</div>
      </div>
    );
  }

  if (showShipForm) {
    return (
      <ShipForm
        orderId={orderId}
        orderNumber={order.order_number}
        lineItems={order.line_items ?? []}
        onComplete={() => {
          setShowShipForm(false);
          queryClient.invalidateQueries({ queryKey: ['order', orderId] });
          queryClient.invalidateQueries({ queryKey: ['orders'] });
          queryClient.invalidateQueries({ queryKey: ['orderShipments', orderId] });
        }}
        onCancel={() => setShowShipForm(false)}
      />
    );
  }

  const lineItems = order.line_items ?? [];
  const allLinesMatched = lineItems.every((li) => li.is_matched);
  const canShip = (order.status === 'pending' || order.status === 'partially_shipped') && allLinesMatched;
  const canCancel = order.status !== 'shipped' && order.status !== 'cancelled';
  const allShipped = lineItems.length > 0 && lineItems.every((li) => li.line_status === 'complete');

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-100"
          >
            &larr; Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{order.order_number}</h1>
            <p className="text-sm text-gray-500">{order.customer_name || 'No customer name'}</p>
          </div>
          {sourceBadge(order.source)}
          {statusBadge(order.status)}
        </div>
        <div className="flex gap-2">
          {canShip && (
            <button
              onClick={() => setShowShipForm(true)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
            >
              Ship Order
            </button>
          )}
          {canCancel && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to cancel this order?')) {
                  cancelMutation.mutate();
                }
              }}
              disabled={cancelMutation.isPending}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium disabled:opacity-50"
            >
              {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Order'}
            </button>
          )}
        </div>
      </div>

      {/* Fully Shipped Banner */}
      {allShipped && order.status === 'shipped' && (
        <div className="mb-6 p-3 bg-green-50 border border-green-200 text-green-800 rounded text-sm font-medium">
          Fully Shipped
        </div>
      )}

      {/* Unmatched Lines Warning */}
      {!allLinesMatched && (order.status === 'pending' || order.status === 'partially_shipped') && (
        <div className="mb-6 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded text-sm">
          Some line items have unmatched SKUs. Resolve all unmatched lines before shipping.
        </div>
      )}

      {/* Order Info */}
      <div className="bg-white rounded shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Order Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Order Number</dt>
            <dd className="mt-1 text-sm text-gray-900 font-mono">{order.order_number}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">External ID</dt>
            <dd className="mt-1 text-sm text-gray-900">{order.external_order_id || '\u2014'}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Source</dt>
            <dd className="mt-1 text-sm">{sourceBadge(order.source)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</dt>
            <dd className="mt-1 text-sm">{statusBadge(order.status)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Customer</dt>
            <dd className="mt-1 text-sm text-gray-900">{order.customer_name || '\u2014'}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Order Date</dt>
            <dd className="mt-1 text-sm text-gray-900">{formatDate(order.order_date)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Import Date</dt>
            <dd className="mt-1 text-sm text-gray-600">{formatDate(order.import_date)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Ship Date</dt>
            <dd className="mt-1 text-sm text-gray-600">{formatDate(order.ship_date)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Last Updated</dt>
            <dd className="mt-1 text-sm text-gray-600">{formatDate(order.updated_at)}</dd>
          </div>
        </div>
        {order.notes && (
          <div className="mt-4 pt-4 border-t">
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Notes</dt>
            <dd className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{order.notes}</dd>
          </div>
        )}
      </div>

      {/* Line Items */}
      <div className="bg-white rounded shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Line Items</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left">
                <th className="px-4 py-3 font-medium text-gray-600">SKU</th>
                <th className="px-4 py-3 font-medium text-gray-600">Product Name</th>
                <th className="px-4 py-3 font-medium text-gray-600 text-right">Ordered Qty</th>
                <th className="px-4 py-3 font-medium text-gray-600 text-right">Shipped Qty</th>
                <th className="px-4 py-3 font-medium text-gray-600 text-right">Remaining</th>
                <th className="px-4 py-3 font-medium text-gray-600 text-right">Stock</th>
                <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    No line items.
                  </td>
                </tr>
              ) : (
                lineItems.map((item) => {
                  const remaining = item.ordered_qty - item.shipped_qty;
                  return (
                    <tr key={item.id} className="border-b">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-gray-800">{item.sku ?? item.external_sku ?? '\u2014'}</span>
                          {!item.is_matched && (
                            <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              UNMATCHED
                            </span>
                          )}
                        </div>
                        {!item.is_matched && item.external_sku && (
                          <p className="text-xs text-gray-500 mt-0.5">External: {item.external_sku}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-800">
                        {item.product_name ?? item.product_name_external ?? '\u2014'}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-800">{item.ordered_qty}</td>
                      <td className="px-4 py-3 text-right text-gray-800">{item.shipped_qty}</td>
                      <td className="px-4 py-3 text-right text-gray-800">{remaining}</td>
                      <td className="px-4 py-3 text-right">
                        {item.qty_on_hand !== undefined && item.qty_on_hand !== null ? (
                          <span className={item.qty_on_hand >= remaining ? 'text-green-600' : 'text-red-600'}>
                            {item.qty_on_hand}
                          </span>
                        ) : (
                          '\u2014'
                        )}
                      </td>
                      <td className="px-4 py-3">{lineStatusBadge(item.line_status)}</td>
                      <td className="px-4 py-3">
                        {!item.is_matched && (
                          <>
                            {resolvingLineId === item.id ? (
                              <ResolveLineInput
                                orderId={orderId}
                                lineId={item.id}
                                onResolved={() => {
                                  setResolvingLineId(null);
                                  queryClient.invalidateQueries({ queryKey: ['order', orderId] });
                                }}
                                onCancel={() => setResolvingLineId(null)}
                              />
                            ) : (
                              <button
                                onClick={() => setResolvingLineId(item.id)}
                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs font-medium"
                              >
                                Resolve
                              </button>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Shipment History */}
      <div className="bg-white rounded shadow p-6">
        <ShipmentHistory orderId={orderId} />
      </div>
    </div>
  );
}

/* --- Resolve Line Input with product search --- */

interface ResolveLineInputProps {
  orderId: number;
  lineId: number;
  onResolved: () => void;
  onCancel: () => void;
}

function ResolveLineInput({ orderId, lineId, onResolved, onCancel }: ResolveLineInputProps) {
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const [resolveError, setResolveError] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resolveMutation = useMutation({
    mutationFn: (productId: number) => orderApi.resolveLine(orderId, lineId, productId),
    onSuccess: () => onResolved(),
    onError: (err: any) => {
      const msg = err?.response?.data?.error ?? err?.message;
      setResolveError(msg);
    },
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchText(value);

    if (timerRef.current) clearTimeout(timerRef.current);
    if (!value.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    timerRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const resp = await productApi.list({ search: value, limit: 10 });
        const products: Product[] = resp?.data?.data ?? resp?.data ?? [];
        setSearchResults(products);
        setShowDropdown(true);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  const selectProduct = (product: Product) => {
    setShowDropdown(false);
    resolveMutation.mutate(product.id);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex items-center gap-1">
        <input
          type="text"
          placeholder="Search product..."
          value={searchText}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-40 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={onCancel}
          type="button"
          className="px-2 py-1 text-gray-500 hover:text-gray-700 text-xs"
        >
          Cancel
        </button>
      </div>
      {resolveError && <p className="text-xs text-red-600 mt-0.5">{resolveError}</p>}
      {resolveMutation.isPending && <p className="text-xs text-gray-500 mt-0.5">Resolving...</p>}
      {showDropdown && (
        <div className="absolute z-10 mt-1 w-56 bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-y-auto">
          {searching && (
            <div className="px-3 py-2 text-sm text-gray-500">Searching...</div>
          )}
          {!searching && searchResults.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-500">No products found</div>
          )}
          {searchResults.map((p) => (
            <button
              type="button"
              key={p.id}
              onClick={() => selectProduct(p)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 border-b last:border-b-0"
            >
              <span className="font-mono text-gray-700">{p.sku}</span>
              <span className="ml-2 text-gray-600">{p.product_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
