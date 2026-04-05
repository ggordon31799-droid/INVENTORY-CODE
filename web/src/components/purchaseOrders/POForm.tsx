import { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { purchaseOrderApi } from '../../services/purchaseOrderApi';
import { productApi } from '../../services/productApi';
import { Product } from '../../types/product';

interface Props {
  onSave: (newId: number) => void;
  onCancel: () => void;
}

interface LineItemDraft {
  key: number;
  product_id: number | null;
  productLabel: string;
  searchText: string;
  ordered_qty: number;
  unit_cost: string;
}

let nextKey = 1;
function makeEmptyLine(): LineItemDraft {
  return {
    key: nextKey++,
    product_id: null,
    productLabel: '',
    searchText: '',
    ordered_qty: 1,
    unit_cost: '',
  };
}

export default function POForm({ onSave, onCancel }: Props) {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    po_number: '',
    supplier: '',
    expected_date: '',
    notes: '',
  });

  const [lineItems, setLineItems] = useState<LineItemDraft[]>([makeEmptyLine()]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: (data: Record<string, any>) => purchaseOrderApi.create(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      const newPo = response?.data?.data ?? response?.data;
      onSave(newPo.id);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error ?? err?.response?.data?.message ?? err.message;
      setErrors({ _form: msg });
    },
  });

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.po_number.trim()) newErrors.po_number = 'PO Number is required';
    if (!formData.supplier.trim()) newErrors.supplier = 'Supplier is required';

    const validLines = lineItems.filter((li) => li.product_id !== null);
    if (validLines.length === 0) {
      newErrors.line_items = 'At least one line item with a selected product is required';
    }

    for (let i = 0; i < lineItems.length; i++) {
      const li = lineItems[i];
      if (li.product_id !== null) {
        if (li.ordered_qty <= 0) {
          newErrors[`line_${i}_qty`] = 'Qty must be > 0';
        }
        if (!li.unit_cost || parseFloat(li.unit_cost) < 0) {
          newErrors[`line_${i}_cost`] = 'Cost is required';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      po_number: formData.po_number.trim(),
      supplier: formData.supplier.trim(),
      expected_date: formData.expected_date || null,
      notes: formData.notes.trim() || null,
      line_items: lineItems
        .filter((li) => li.product_id !== null)
        .map((li) => ({
          product_id: li.product_id,
          ordered_qty: li.ordered_qty,
          unit_cost: li.unit_cost,
        })),
    };

    mutation.mutate(payload);
  };

  const updateLine = (key: number, updates: Partial<LineItemDraft>) => {
    setLineItems((prev) =>
      prev.map((li) => (li.key === key ? { ...li, ...updates } : li))
    );
  };

  const removeLine = (key: number) => {
    setLineItems((prev) => {
      const next = prev.filter((li) => li.key !== key);
      return next.length === 0 ? [makeEmptyLine()] : next;
    });
  };

  const addLine = () => {
    setLineItems((prev) => [...prev, makeEmptyLine()]);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">New Purchase Order</h1>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-100"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded shadow p-6">
        {errors._form && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
            {errors._form}
          </div>
        )}

        {/* Header fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              PO Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.po_number}
              onChange={(e) => setFormData((d) => ({ ...d, po_number: e.target.value }))}
              className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 ${
                errors.po_number ? 'border-red-500' : ''
              }`}
            />
            {errors.po_number && <p className="mt-1 text-xs text-red-600">{errors.po_number}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Supplier <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.supplier}
              onChange={(e) => setFormData((d) => ({ ...d, supplier: e.target.value }))}
              className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 ${
                errors.supplier ? 'border-red-500' : ''
              }`}
            />
            {errors.supplier && <p className="mt-1 text-xs text-red-600">{errors.supplier}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expected Date</label>
            <input
              type="date"
              value={formData.expected_date}
              onChange={(e) => setFormData((d) => ({ ...d, expected_date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData((d) => ({ ...d, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Line Items */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-800">Line Items</h2>
            <button
              type="button"
              onClick={addLine}
              className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
            >
              Add Line
            </button>
          </div>

          {errors.line_items && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
              {errors.line_items}
            </div>
          )}

          <div className="space-y-3">
            {lineItems.map((li, idx) => (
              <ProductLineItem
                key={li.key}
                line={li}
                index={idx}
                errors={errors}
                onUpdate={(updates) => updateLine(li.key, updates)}
                onRemove={() => removeLine(li.key)}
              />
            ))}
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
          >
            {mutation.isPending ? 'Creating...' : 'Create Purchase Order'}
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

/* --- Product Line Item with search dropdown --- */

interface ProductLineItemProps {
  line: LineItemDraft;
  index: number;
  errors: Record<string, string>;
  onUpdate: (updates: Partial<LineItemDraft>) => void;
  onRemove: () => void;
}

function ProductLineItem({ line, index, errors, onUpdate, onRemove }: ProductLineItemProps) {
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    onUpdate({ searchText: value, product_id: null, productLabel: '' });

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
    onUpdate({
      product_id: product.id,
      productLabel: `${product.sku} - ${product.product_name}`,
      searchText: `${product.sku} - ${product.product_name}`,
    });
    setShowDropdown(false);
  };

  return (
    <div className="flex gap-3 items-start p-3 border border-gray-200 rounded bg-gray-50">
      <div className="flex-1 relative" ref={dropdownRef}>
        <label className="block text-xs font-medium text-gray-500 mb-1">Product</label>
        <input
          type="text"
          placeholder="Search products by SKU or name..."
          value={line.searchText}
          onChange={(e) => handleSearchChange(e.target.value)}
          onFocus={() => {
            if (searchResults.length > 0 && !line.product_id) setShowDropdown(true);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {line.product_id && (
          <p className="mt-0.5 text-xs text-green-600">Selected: {line.productLabel}</p>
        )}
        {showDropdown && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-y-auto">
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

      <div className="w-28">
        <label className="block text-xs font-medium text-gray-500 mb-1">Ordered Qty</label>
        <input
          type="number"
          min={1}
          value={line.ordered_qty}
          onChange={(e) => onUpdate({ ordered_qty: parseInt(e.target.value, 10) || 0 })}
          className={`w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors[`line_${index}_qty`] ? 'border-red-500' : ''
          }`}
        />
        {errors[`line_${index}_qty`] && (
          <p className="mt-0.5 text-xs text-red-600">{errors[`line_${index}_qty`]}</p>
        )}
      </div>

      <div className="w-32">
        <label className="block text-xs font-medium text-gray-500 mb-1">Unit Cost</label>
        <input
          type="number"
          step="0.01"
          min={0}
          value={line.unit_cost}
          onChange={(e) => onUpdate({ unit_cost: e.target.value })}
          placeholder="0.00"
          className={`w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors[`line_${index}_cost`] ? 'border-red-500' : ''
          }`}
        />
        {errors[`line_${index}_cost`] && (
          <p className="mt-0.5 text-xs text-red-600">{errors[`line_${index}_cost`]}</p>
        )}
      </div>

      <div className="pt-5">
        <button
          type="button"
          onClick={onRemove}
          className="px-3 py-2 text-red-600 hover:bg-red-50 rounded text-sm font-medium"
        >
          Remove
        </button>
      </div>
    </div>
  );
}
