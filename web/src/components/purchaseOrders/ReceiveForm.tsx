import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { purchaseOrderApi } from '../../services/purchaseOrderApi';
import { POLineItem } from '../../types/purchaseOrder';

interface Props {
  poId: number;
  poNumber: string;
  lineItems: POLineItem[];
  onComplete: () => void;
  onCancel: () => void;
}

interface ReceiveLine {
  po_line_item_id: number;
  sku: string;
  product_name: string;
  ordered_qty: number;
  received_qty: number;
  remaining: number;
  receiving_qty: number;
}

export default function ReceiveForm({ poId, poNumber, lineItems, onComplete, onCancel }: Props) {
  const receivableItems = lineItems.filter((li) => li.ordered_qty - li.received_qty > 0);

  const [lines, setLines] = useState<ReceiveLine[]>(
    receivableItems.map((li) => {
      const remaining = li.ordered_qty - li.received_qty;
      return {
        po_line_item_id: li.id,
        sku: li.sku ?? '',
        product_name: li.product_name ?? '',
        ordered_qty: li.ordered_qty,
        received_qty: li.received_qty,
        remaining,
        receiving_qty: remaining,
      };
    })
  );

  const [bolNumber, setBolNumber] = useState('');
  const [receivedBy, setReceivedBy] = useState('admin');
  const [formError, setFormError] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: (data: Record<string, any>) => purchaseOrderApi.receive(poId, data),
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

  const updateReceivingQty = (poLineItemId: number, qty: number) => {
    setLines((prev) =>
      prev.map((l) => (l.po_line_item_id === poLineItemId ? { ...l, receiving_qty: qty } : l))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!receivedBy.trim()) {
      setFormError('Received By is required');
      return;
    }

    const receivingLines = lines
      .filter((l) => l.receiving_qty > 0)
      .map((l) => ({
        po_line_item_id: l.po_line_item_id,
        received_qty: l.receiving_qty,
      }));

    if (receivingLines.length === 0) {
      setFormError('At least one line must have a receiving quantity greater than 0');
      return;
    }

    mutation.mutate({
      received_by: receivedBy.trim(),
      bol_number: bolNumber.trim() || null,
      line_items: receivingLines,
    });
  };

  if (success && warnings.length > 0) {
    return (
      <div className="max-w-3xl">
        <div className="bg-white rounded shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Receipt Created with Warnings</h2>
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

  if (receivableItems.length === 0) {
    return (
      <div className="max-w-3xl">
        <div className="bg-white rounded shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Receive Inventory - {poNumber}</h2>
          <p className="text-gray-500 mb-4">All line items have been fully received.</p>
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
        <h1 className="text-2xl font-bold">Receive Inventory - {poNumber}</h1>
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

        {/* Receipt header fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Received By <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={receivedBy}
              onChange={(e) => setReceivedBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">BOL Number</label>
            <input
              type="text"
              value={bolNumber}
              onChange={(e) => setBolNumber(e.target.value)}
              placeholder="Optional"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Line items */}
        <div className="border-t pt-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Items to Receive</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-600">SKU</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Product Name</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-right">Ordered</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-right">Previously Received</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-right">Remaining</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-right">Receiving Qty</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => {
                  const overReceiving = line.receiving_qty > line.remaining;
                  return (
                    <tr key={line.po_line_item_id} className="border-b">
                      <td className="px-4 py-3 font-mono text-gray-800">{line.sku || '\u2014'}</td>
                      <td className="px-4 py-3 text-gray-800">{line.product_name || '\u2014'}</td>
                      <td className="px-4 py-3 text-right text-gray-800">{line.ordered_qty}</td>
                      <td className="px-4 py-3 text-right text-gray-800">{line.received_qty}</td>
                      <td className="px-4 py-3 text-right text-gray-800">{line.remaining}</td>
                      <td className="px-4 py-3 text-right">
                        <input
                          type="number"
                          min={0}
                          value={line.receiving_qty}
                          onChange={(e) =>
                            updateReceivingQty(line.po_line_item_id, parseInt(e.target.value, 10) || 0)
                          }
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {overReceiving && (
                          <p className="text-xs text-amber-600 mt-1">
                            Exceeds remaining qty
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
            {mutation.isPending ? 'Processing...' : 'Confirm Receipt'}
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
