import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productApi } from '../../services/productApi';
import { Product } from '../../types/product';

interface Props {
  product?: Product;
  onSave: () => void;
  onCancel: () => void;
}

export default function ProductForm({ product, onSave, onCancel }: Props) {
  const isEdit = !!product;
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    sku: product?.sku ?? '',
    product_name: product?.product_name ?? '',
    barcode: product?.barcode ?? '',
    category: product?.category ?? '',
    reorder_threshold: product?.reorder_threshold ?? 0,
    location: product?.location ?? '',
    status: product?.status ?? 'active',
    notes: product?.notes ?? '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: (data: Record<string, any>) =>
      isEdit ? productApi.update(product!.id, data) : productApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      if (isEdit) {
        queryClient.invalidateQueries({ queryKey: ['product', product!.id] });
      }
      onSave();
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.error ?? err?.response?.data?.message ?? err.message;
      setErrors({ _form: msg });
    },
  });

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.sku.trim()) newErrors.sku = 'SKU is required';
    if (!formData.product_name.trim())
      newErrors.product_name = 'Product name is required';
    if (formData.reorder_threshold < 0)
      newErrors.reorder_threshold = 'Must be 0 or greater';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: Record<string, any> = {
      product_name: formData.product_name.trim(),
      barcode: formData.barcode.trim() || null,
      category: formData.category.trim() || null,
      reorder_threshold: formData.reorder_threshold,
      location: formData.location.trim() || null,
      notes: formData.notes.trim() || null,
    };

    if (!isEdit) {
      payload.sku = formData.sku.trim();
    }

    if (isEdit) {
      payload.status = formData.status;
    }

    mutation.mutate(payload);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'reorder_threshold' ? parseInt(value, 10) || 0 : value,
    }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{isEdit ? 'Edit Product' : 'New Product'}</h1>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-100"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl bg-white rounded shadow p-6">
        {errors._form && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
            {errors._form}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SKU <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              disabled={isEdit}
              className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isEdit ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'border-gray-300'
              } ${errors.sku ? 'border-red-500' : ''}`}
            />
            {errors.sku && (
              <p className="mt-1 text-xs text-red-600">{errors.sku}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="product_name"
              value={formData.product_name}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 ${
                errors.product_name ? 'border-red-500' : ''
              }`}
            />
            {errors.product_name && (
              <p className="mt-1 text-xs text-red-600">{errors.product_name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
            <input
              type="text"
              name="barcode"
              value={formData.barcode}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reorder Threshold
            </label>
            <input
              type="number"
              name="reorder_threshold"
              value={formData.reorder_threshold}
              onChange={handleChange}
              min={0}
              className={`w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.reorder_threshold ? 'border-red-500' : ''
              }`}
            />
            {errors.reorder_threshold && (
              <p className="mt-1 text-xs text-red-600">{errors.reorder_threshold}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {isEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          )}
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
          >
            {mutation.isPending
              ? 'Saving...'
              : isEdit
              ? 'Save Changes'
              : 'Create Product'}
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
