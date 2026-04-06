import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { orderApi } from '../../services/orderApi';
import { OrderLineItem } from '../../types/order';

interface Props {
  orderId: number;
  orderNumber: string;
  lineItems: OrderLineItem[];
  onComplete: () => void;
  onCancel: () => void;
}

interface ShipLine {
  order_line_item_id: number;
  sku: string;
  product_name: string;
  ordered_qty: number;
  shipped_qty: number;
  remaining: number;
  shipping_qty: number;
  qty_on_hand: number | undefined;
}

export default function ShipForm({ orderId, orderNumber, lineItems, onComplete, onCancel }: Props) {
  const shippableItems = lineItems.filter((li) => li.ordered_qty - li.shipped_qty > 0);

  const [lines, setLines] = useState<ShipLine[]>(
    shippableItems.map((li) => {
      const remaining = li.ordered_qty - li.shipped_qty;
      return {
        order_line_item_id: li.id,
        sku: li.sku ?? '',
        product_name: li.product_name ?? '',
        ordered_qty: li.ordered_qty,
        shipped_qty: li.shipped_qty,
        remaining,
        shipping_qty: remaining,
        qty_on_hand: li.qty_on_hand,
      };
    })
  );

  const [trackingNumber, setTrackingNumber] = useState('');
  const [shippedBy, setShippedBy] = useState('admin');
  const [formError, setFormError] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: (data: Record<string, any>) => orderApi.ship(orderId, data),
    onSuccess: (response) => {
      const respWarnings = response?.data?.warnings ?? [];
      if (respWarnings.length > 0) {
        setWarnings(respWarnings);
        setSuccess(true);
      } else {
        onComplete();
      }
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error ?? err?.response?.data?.message ?? err.message;
      setFormError(msg);
    },
  });

  const updateShippingQty = (orderLineItemId: number, qty: number) => {
    setLines((prev) =>
      prev.map((l) => (l.order_line_item_id === orderLineItemId ? { ...l, shipping_qty: qty } : l))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!shippedBy.trim()) {
      setFormError('Shipped By is required');
      return;
    }

    const shippingLines = lines
      .filter((l) => l.shipping_qty > 0)
      .map((l) => ({
        order_line_item_id: l.order_line_item_id,
        shipped_qty: l.shipping_qty,
      }));

    if (shippingLines.length === 0) {
      setFormError('At least one line must have a shipping quantity greater than 0');
      return;
    }

    mutation.mutate({
      shipped_by: shippedBy.trim(),
      tracking_number: trackingNumber.trim() || null,
      line_items: shippingLines,
    });
  };

  if (success && warnings.length > 0) {
    return (
      <div className="max-w-3xl">
        <div className="bg-white rounded shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Shipment Created with Warnings</h2>
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded text-sm">
            <p className="font-medium mb-1">Warnings:</p>
            <ul className="list-disc list-inside">
              {warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
          <button
            onClick={onComplete}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
          >
            OK
          </button>
        </div>
      </div>
    );
  }

  if (shippableItems.length === 0) {
    return (
      <div className="max-w-3xl">
        <div className="bg-white rounded shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Ship Order - {orderNumber}</h2>
          <p className="text-gray-500 mb-4">All line items have been fully shipped.</p>
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-100"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Ship Order - {orderNumber}</h1>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-100"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded shadow p-6">
        {formError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
            {formError}
          </div>
        )}

        {/* Shipment header fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shipped By <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={shippedBy}
              onChange={(e) => setShippedBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Number</label>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Optional"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Line items */}
        <div className="border-t pt-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Items to Ship</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-600">SKU</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Product Name</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-right">Ordered</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-right">Previously Shipped</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-right">Remaining</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-right">Stock</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-right">Shipping Qty</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => {
                  const overStock = line.qty_on_hand !== undefined && line.shipping_qty > line.qty_on_hand;
                  return (
                    <tr key={line.order_line_item_id} className="border-b">
                      <td className="px-4 py-3 font-mono text-gray-800">{line.sku || '\u2014'}</td>
                      <td className="px-4 py-3 text-gray-800">{line.product_name || '\u2014'}</td>
                      <td className="px-4 py-3 text-right text-gray-800">{line.ordered_qty}</td>
                      <td className="px-4 py-3 text-right text-gray-800">{line.shipped_qty}</td>
                      <td className="px-4 py-3 text-right text-gray-800">{line.remaining}</td>
                      <td className="px-4 py-3 text-right">
                        {line.qty_on_hand !== undefined ? (
                          <span className={line.qty_on_hand >= line.remaining ? 'text-green-600' : 'text-red-600'}>
                            {line.qty_on_hand}
                          </span>
                        ) : (
                          '\u2014'
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <input
                          type="number"
                          min={0}
                          value={line.shipping_qty}
                          onChange={(e) =>
                            updateShippingQty(line.order_line_item_id, parseInt(e.target.value, 10) || 0)
                          }
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {overStock && (
                          <p className="text-xs text-amber-600 mt-1">
                            Exceeds available stock
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium disabled:opacity-50"
          >
            {mutation.isPending ? 'Processing...' : 'Confirm Shipment'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
