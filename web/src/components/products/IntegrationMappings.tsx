import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productApi } from '../../services/productApi';
import { IntegrationMapping } from '../../types/product';

interface Props {
  productId: number;
}

const PLATFORMS = ['eBay', 'WooCommerce'];

export default function IntegrationMappings({ productId }: Props) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    platform: PLATFORMS[0],
    external_sku: '',
    external_name: '',
  });
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['mappings', productId],
    queryFn: () => productApi.getMappings(productId),
  });

  const mappings: IntegrationMapping[] = data?.data?.data ?? data?.data ?? [];

  const addMutation = useMutation({
    mutationFn: (payload: Record<string, any>) =>
      productApi.addMapping(productId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mappings', productId] });
      setFormData({ platform: PLATFORMS[0], external_sku: '', external_name: '' });
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (mappingId: number) =>
      productApi.deleteMapping(productId, mappingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mappings', productId] });
      setDeleteConfirm(null);
    },
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.external_sku.trim()) return;
    addMutation.mutate({
      platform: formData.platform,
      external_sku: formData.external_sku.trim(),
      external_name: formData.external_name.trim() || null,
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800">Integration Mappings</h3>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
          >
            Add Mapping
          </button>
        )}
      </div>

      {isLoading && <p className="text-sm text-gray-500">Loading mappings...</p>}
      {isError && <p className="text-sm text-red-600">Failed to load mappings.</p>}

      {!isLoading && !isError && (
        <>
          {mappings.length === 0 ? (
            <p className="text-sm text-gray-500">No integration mappings yet.</p>
          ) : (
            <table className="w-full text-sm mb-4">
              <thead>
                <tr className="border-b bg-gray-50 text-left">
                  <th className="px-3 py-2 font-medium text-gray-600">Platform</th>
                  <th className="px-3 py-2 font-medium text-gray-600">External SKU</th>
                  <th className="px-3 py-2 font-medium text-gray-600">External Name</th>
                  <th className="px-3 py-2 font-medium text-gray-600 w-20"></th>
                </tr>
              </thead>
              <tbody>
                {mappings.map((m) => (
                  <tr key={m.id} className="border-b">
                    <td className="px-3 py-2">{m.platform}</td>
                    <td className="px-3 py-2 font-mono">{m.external_sku}</td>
                    <td className="px-3 py-2 text-gray-600">{m.external_name ?? '—'}</td>
                    <td className="px-3 py-2">
                      {deleteConfirm === m.id ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => deleteMutation.mutate(m.id)}
                            disabled={deleteMutation.isPending}
                            className="px-2 py-0.5 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="px-2 py-0.5 border rounded text-xs hover:bg-gray-100"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(m.id)}
                          className="px-2 py-0.5 text-red-600 border border-red-300 rounded text-xs hover:bg-red-50"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {showForm && (
        <form onSubmit={handleAdd} className="mt-3 p-3 bg-gray-50 border rounded">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Platform</label>
              <select
                value={formData.platform}
                onChange={(e) => setFormData((f) => ({ ...f, platform: e.target.value }))}
                className="px-2 py-1.5 border border-gray-300 rounded text-sm"
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                External SKU <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.external_sku}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, external_sku: e.target.value }))
                }
                className="px-2 py-1.5 border border-gray-300 rounded text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                External Name
              </label>
              <input
                type="text"
                value={formData.external_name}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, external_name: e.target.value }))
                }
                className="px-2 py-1.5 border border-gray-300 rounded text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={addMutation.isPending}
                className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {addMutation.isPending ? 'Adding...' : 'Add'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </div>
          {addMutation.isError && (
            <p className="mt-2 text-xs text-red-600">
              Failed to add mapping: {(addMutation.error as Error).message}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
