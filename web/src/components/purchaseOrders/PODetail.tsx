import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchaseOrderApi } from '../../services/purchaseOrderApi';
import { PurchaseOrder, POLineItem } from '../../types/purchaseOrder';
import ReceiveForm from './ReceiveForm';
import ReceiptHistory from './ReceiptHistory';

interface Props {
  poId: number;
  onBack: () => void;
}

function statusBadge(status: string) {
  const map: Record<string, { bg: string; label: string }> = {
    open: { bg: 'bg-blue-100 text-blue-800', label: 'Open' },
    partially_received: { bg: 'bg-amber-100 text-amber-800', label: 'Partially Received' },
    fully_received: { bg: 'bg-green-100 text-green-800', label: 'Fully Received' },
    closed: { bg: 'bg-gray-100 text-gray-600', label: 'Closed' },
    voided: { bg: 'bg-red-100 text-red-800', label: 'Voided' },
  };
  const entry = map[status] ?? { bg: 'bg-gray-100 text-gray-600', label: status };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${entry.bg}`}>
      {entry.label}
    </span>
  );
}

function lineStatusBadge(status: string) {
  const map: Record<string, { bg: string; label: string }> = {
    open: { bg: 'bg-blue-100 text-blue-800', label: 'Open' },
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

export default function PODetail({ poId, onBack }: Props) {
  const queryClient = useQueryClient();
  const [showReceiveForm, setShowReceiveForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ supplier: '', expected_date: '', notes: '' });
  const [editError, setEditError] = useState('');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['purchaseOrder', poId],
    queryFn: () => purchaseOrderApi.get(poId),
  });

  const po: PurchaseOrder | undefined = data?.data?.data ?? data?.data;

  const closeMutation = useMutation({
    mutationFn: () => purchaseOrderApi.close(poId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrder', poId] });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
    },
  });

  const voidMutation = useMutation({
    mutationFn: () => purchaseOrderApi.void(poId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrder', poId] });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error ?? err?.message;
      alert(msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Record<string, any>) => purchaseOrderApi.update(poId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrder', poId] });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      setEditing(false);
      setEditError('');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error ?? err?.response?.data?.message ?? err.message;
      setEditError(msg);
    },
  });

  const formatCurrency = (value: string) => `$${parseFloat(value).toFixed(2)}`;
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '\u2014';
    return new Date(dateStr).toLocaleDateString();
  };

  const startEdit = () => {
    if (!po) return;
    setEditData({
      supplier: po.supplier,
      expected_date: po.expected_date ?? '',
      notes: po.notes ?? '',
    });
    setEditError('');
    setEditing(true);
  };

  const saveEdit = () => {
    if (!editData.supplier.trim()) {
      setEditError('Supplier is required');
      return;
    }
    updateMutation.mutate({
      supplier: editData.supplier.trim(),
      expected_date: editData.expected_date || null,
      notes: editData.notes.trim() || null,
    });
  };

  if (isLoading) {
    return <div className="text-gray-500 py-8 text-center">Loading purchase order...</div>;
  }

  if (isError) {
    return (
      <div>
        <button
          onClick={onBack}
          className="mb-4 px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-100"
        >
          &larr; Back to Purchase Orders
        </button>
        <div className="text-red-600 py-8 text-center">
          Error loading purchase order: {(error as Error).message}
        </div>
      </div>
    );
  }

  if (!po) {
    return (
      <div>
        <button
          onClick={onBack}
          className="mb-4 px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-100"
        >
          &larr; Back to Purchase Orders
        </button>
        <div className="text-gray-500 py-8 text-center">Purchase order not found.</div>
      </div>
    );
  }

  if (showReceiveForm) {
    return (
      <ReceiveForm
        poId={poId}
        poNumber={po.po_number}
        lineItems={po.line_items ?? []}
        onComplete={() => {
          setShowReceiveForm(false);
          queryClient.invalidateQueries({ queryKey: ['purchaseOrder', poId] });
          queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
          queryClient.invalidateQueries({ queryKey: ['poReceipts', poId] });
        }}
        onCancel={() => setShowReceiveForm(false)}
      />
    );
  }

  const lineItems = po.line_items ?? [];
  const isTerminal = po.status === 'closed' || po.status === 'voided' || po.status === 'fully_received';
  const canReceive = !isTerminal;
  const canClose = po.status !== 'closed' && po.status !== 'voided';
  const canEdit = !isTerminal;
  const canVoid = po.status === 'open' && lineItems.every((l) => l.received_qty === 0);

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
            <h1 className="text-2xl font-bold text-gray-900">{po.po_number}</h1>
            <p className="text-sm text-gray-500">{po.supplier}</p>
          </div>
          {statusBadge(po.status)}
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <button
              onClick={startEdit}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
            >
              Edit
            </button>
          )}
          {canReceive && (
            <button
              onClick={() => setShowReceiveForm(true)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
            >
              Receive Inventory
            </button>
          )}
          {canClose && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to close this PO?')) {
                  closeMutation.mutate();
                }
              }}
              disabled={closeMutation.isPending}
              className="px-4 py-2 border border-gray-400 text-gray-700 rounded hover:bg-gray-100 text-sm font-medium disabled:opacity-50"
            >
              {closeMutation.isPending ? 'Closing...' : 'Close PO'}
            </button>
          )}
          {canVoid && (
            <button
              onClick={() => {
                if (window.confirm(
                  'Void this PO? This cannot be undone. The PO will remain as a historical record.'
                )) {
                  voidMutation.mutate();
                }
              }}
              disabled={voidMutation.isPending}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium disabled:opacity-50"
            >
              {voidMutation.isPending ? 'Voiding...' : 'Void PO'}
            </button>
          )}
        </div>
      </div>

      {/* Inline Edit Section */}
      {editing && (
        <div className="bg-white rounded shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Edit Purchase Order</h2>
          {editError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
              {editError}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supplier <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={editData.supplier}
                onChange={(e) => setEditData((d) => ({ ...d, supplier: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expected Date</label>
              <input
                type="date"
                value={editData.expected_date}
                onChange={(e) => setEditData((d) => ({ ...d, expected_date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <input
                type="text"
                value={editData.notes}
                onChange={(e) => setEditData((d) => ({ ...d, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              onClick={saveEdit}
              disabled={updateMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={() => { setEditing(false); setEditError(''); }}
              className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* PO Info */}
      <div className="bg-white rounded shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Purchase Order Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">PO Number</dt>
            <dd className="mt-1 text-sm text-gray-900 font-mono">{po.po_number}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Supplier</dt>
            <dd className="mt-1 text-sm text-gray-900">{po.supplier}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</dt>
            <dd className="mt-1 text-sm">{statusBadge(po.status)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Expected Date</dt>
            <dd className="mt-1 text-sm text-gray-900">{formatDate(po.expected_date)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Created</dt>
            <dd className="mt-1 text-sm text-gray-600">{formatDate(po.created_at)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Last Updated</dt>
            <dd className="mt-1 text-sm text-gray-600">{formatDate(po.updated_at)}</dd>
          </div>
        </div>
        {po.notes && (
          <div className="mt-4 pt-4 border-t">
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Notes</dt>
            <dd className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{po.notes}</dd>
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
                <th className="px-4 py-3 font-medium text-gray-600 text-right">Received Qty</th>
                <th className="px-4 py-3 font-medium text-gray-600 text-right">Remaining</th>
                <th className="px-4 py-3 font-medium text-gray-600 text-right">Unit Cost</th>
                <th className="px-4 py-3 font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No line items.
                  </td>
                </tr>
              ) : (
                lineItems.map((item) => {
                  const remaining = item.ordered_qty - item.received_qty;
                  return (
                    <tr key={item.id} className="border-b">
                      <td className="px-4 py-3 font-mono text-gray-800">{item.sku ?? '\u2014'}</td>
                      <td className="px-4 py-3 text-gray-800">{item.product_name ?? '\u2014'}</td>
                      <td className="px-4 py-3 text-right text-gray-800">{item.ordered_qty}</td>
                      <td className="px-4 py-3 text-right text-gray-800">{item.received_qty}</td>
                      <td className="px-4 py-3 text-right text-gray-800">{remaining}</td>
                      <td className="px-4 py-3 text-right text-gray-800">{formatCurrency(item.unit_cost)}</td>
                      <td className="px-4 py-3">{lineStatusBadge(item.line_status)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt History */}
      <div className="bg-white rounded shadow p-6">
        <ReceiptHistory poId={poId} />
      </div>
    </div>
  );
}
