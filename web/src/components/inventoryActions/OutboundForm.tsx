import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { manualOutboundApi } from '../../services/manualOutboundApi';
import { productApi } from '../../services/productApi';
import { Product } from '../../types/product';

const OUTBOUND_TYPES = [
  { value: 'amazon_fba', label: 'Amazon FBA' },
  { value: 'amazon_order', label: 'Amazon Order' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'internal_use', label: 'Internal Use' },
  { value: 'sample', label: 'Sample' },
  { value: 'other', label: 'Other' },
];

interface LineDraft {
  key: number;
  product_id: number | null;
  productLabel: string;
  searchText: string;
  qty: number;
  weighted_avg_cost: string;
}

let nextKey = 1;
function makeEmptyLine(): LineDraft {
  return { key: nextKey++, product_id: null, productLabel: '', searchText: '', qty: 1, weighted_avg_cost: '0' };
}

interface Props {
  onComplete: () => void;
  onCancel: () => void;
}

export default function OutboundForm({ onComplete, onCancel }: Props) {
  const queryClient = useQueryClient();
  const [outboundType, setOutboundType] = useState('amazon_fba');
  const [reasonText, setReasonText] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [createdBy, setCreatedBy] = useState('admin');
  const [lines, setLines] = useState<LineDraft[]>([makeEmptyLine()]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Product search state per line
  const [searchResults, setSearchResults] = useState<Record<number, Product[]>>({});
  const [activeSearch, setActiveSearch] = useState<number | null>(null);

  const mutation = useMutation({
    mutationFn: (data: Record<string, any>) => manualOutboundApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manualOutbound'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['damagedReport'] });
      onComplete();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error ?? err.message;
      setErrors({ _form: msg });
    },
  });

  const searchProducts = async (lineKey: number, term: string) => {
    if (term.length < 1) {
      setSearchResults((prev) => ({ ...prev, [lineKey]: [] }));
      return;
    }
    try {
      const res = await productApi.list({ search: term, limit: 10 });
      const products = res?.data?.data ?? res?.data ?? [];
      setSearchResults((prev) => ({ ...prev, [lineKey]: products }));
    } catch {
      // ignore search errors
    }
  };

  const selectProduct = (lineKey: number, product: Product) => {
    setLines((prev) =>
      prev.map((l) =>
        l.key === lineKey
          ? {
              ...l,
              product_id: product.id,
              productLabel: `${product.sku} — ${product.product_name}`,
              searchText: '',
              weighted_avg_cost: product.weighted_avg_cost,
            }
          : l
      )
    );
    setSearchResults((prev) => ({ ...prev, [lineKey]: [] }));
    setActiveSearch(null);
  };

  const updateLine = (key: number, field: string, value: any) => {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, [field]: value } : l)));
  };

  const removeLine = (key: number) => {
    setLines((prev) => (prev.length > 1 ? prev.filter((l) => l.key !== key) : prev));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!createdBy.trim()) {
      setErrors({ _form: 'Created By is required' });
      return;
    }

    const validLines = lines.filter((l) => l.product_id !== null);
    if (validLines.length === 0) {
      setErrors({ _form: 'At least one product must be selected' });
      return;
    }

    mutation.mutate({
      outbound_type: outboundType,
      reason_text: outboundType === 'other' ? reasonText.trim() || null : null,
      reference_number: referenceNumber.trim() || null,
      created_by: createdBy.trim(),
      line_items: validLines.map((l) => ({
        product_id: l.product_id,
        qty: l.qty,
      })),
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Manual Outbound</h1>
        <button onClick={onCancel} className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-100">
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded shadow p-6">
        {errors._form && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{errors._form}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Outbound Type <span className="text-red-500">*</span>
            </label>
            <select
              value={outboundType}
              onChange={(e) => setOutboundType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {OUTBOUND_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Created By <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={createdBy}
              onChange={(e) => setCreatedBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number</label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="Optional (e.g., FBA shipment ID)"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {outboundType === 'other' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
              <input
                type="text"
                value={reasonText}
                onChange={(e) => setReasonText(e.target.value)}
                placeholder="Describe the reason"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        {outboundType === 'damaged' && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded text-sm">
            Damaged outbound captures the current weighted average cost per unit for supplier credit tracking.
          </div>
        )}

        {/* Line Items */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-800">Items</h2>
            <button
              type="button"
              onClick={() => setLines((prev) => [...prev, makeEmptyLine()])}
              className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-100"
            >
              + Add Line
            </button>
          </div>

          <div className="space-y-3">
            {lines.map((line) => (
              <div key={line.key} className="flex items-start gap-3 p-3 border rounded bg-gray-50">
                <div className="flex-1 relative">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Product</label>
                  {line.product_id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-900">{line.productLabel}</span>
                      <button
                        type="button"
                        onClick={() => updateLine(line.key, 'product_id', null)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        clear
                      </button>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="text"
                        value={line.searchText}
                        onChange={(e) => {
                          updateLine(line.key, 'searchText', e.target.value);
                          setActiveSearch(line.key);
                          searchProducts(line.key, e.target.value);
                        }}
                        onFocus={() => setActiveSearch(line.key)}
                        placeholder="Search SKU or name..."
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {activeSearch === line.key && (searchResults[line.key] ?? []).length > 0 && (
                        <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg max-h-40 overflow-y-auto">
                          {searchResults[line.key].map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => selectProduct(line.key, p)}
                              className="block w-full text-left px-3 py-2 text-sm hover:bg-blue-50"
                            >
                              <span className="font-mono">{p.sku}</span> — {p.product_name}
                              <span className="text-gray-500 ml-2">(qty: {p.qty_on_hand})</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="w-24">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Qty</label>
                  <input
                    type="number"
                    min={1}
                    value={line.qty}
                    onChange={(e) => updateLine(line.key, 'qty', parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {outboundType === 'damaged' && line.product_id && (
                  <div className="w-28">
                    <label className="block text-xs font-medium text-gray-500 mb-1">WAC</label>
                    <div className="px-3 py-2 text-sm text-gray-600 font-mono">
                      ${parseFloat(line.weighted_avg_cost).toFixed(4)}
                    </div>
                  </div>
                )}

                <div className="pt-5">
                  <button
                    type="button"
                    onClick={() => removeLine(line.key)}
                    disabled={lines.length <= 1}
                    className="px-2 py-1.5 text-red-600 hover:bg-red-50 rounded text-sm disabled:opacity-30"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium disabled:opacity-50"
          >
            {mutation.isPending ? 'Processing...' : 'Confirm Outbound'}
          </button>
          <button type="button" onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-100">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
