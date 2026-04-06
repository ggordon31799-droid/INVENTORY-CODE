import { useQuery } from '@tanstack/react-query';
import { manualOutboundApi } from '../../services/manualOutboundApi';
import { ManualOutbound, ManualOutboundLineItem } from '../../types/manualOutbound';

const TYPE_LABELS: Record<string, string> = {
  amazon_fba: 'Amazon FBA',
  amazon_order: 'Amazon Order',
  damaged: 'Damaged',
  internal_use: 'Internal Use',
  sample: 'Sample',
  other: 'Other',
};

interface Props {
  outboundId: number;
  onBack: () => void;
}

export default function OutboundDetail({ outboundId, onBack }: Props) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['manualOutbound', outboundId],
    queryFn: () => manualOutboundApi.get(outboundId),
  });

  const outbound: ManualOutbound | undefined = data?.data;
  const lineItems: ManualOutboundLineItem[] = outbound?.line_items ?? [];

  if (isLoading) return <div className="text-gray-500 py-8 text-center">Loading...</div>;
  if (isError || !outbound) {
    return (
      <div>
        <button onClick={onBack} className="mb-4 px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-100">&larr; Back</button>
        <div className="text-red-600 py-8 text-center">Error loading outbound record.</div>
      </div>
    );
  }

  const isDamaged = outbound.outbound_type === 'damaged';

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-100">&larr; Back</button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Outbound #{outbound.id}</h1>
          <p className="text-sm text-gray-500">{new Date(outbound.created_at).toLocaleString()}</p>
        </div>
        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
          isDamaged ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'
        }`}>
          {TYPE_LABELS[outbound.outbound_type] ?? outbound.outbound_type}
        </span>
      </div>

      <div className="bg-white rounded shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase">Type</dt>
            <dd className="mt-1 text-sm">{TYPE_LABELS[outbound.outbound_type] ?? outbound.outbound_type}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase">Created By</dt>
            <dd className="mt-1 text-sm">{outbound.created_by}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase">Reference</dt>
            <dd className="mt-1 text-sm font-mono">{outbound.reference_number ?? '—'}</dd>
          </div>
          {outbound.reason_text && (
            <div className="md:col-span-3">
              <dt className="text-xs font-medium text-gray-500 uppercase">Reason</dt>
              <dd className="mt-1 text-sm">{outbound.reason_text}</dd>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Line Items</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left">
              <th className="px-4 py-3 font-medium text-gray-600">SKU</th>
              <th className="px-4 py-3 font-medium text-gray-600">Product Name</th>
              <th className="px-4 py-3 font-medium text-gray-600 text-right">Qty</th>
              {isDamaged && <th className="px-4 py-3 font-medium text-gray-600 text-right">Unit Cost</th>}
              {isDamaged && <th className="px-4 py-3 font-medium text-gray-600 text-right">Total Cost</th>}
            </tr>
          </thead>
          <tbody>
            {lineItems.map((li) => (
              <tr key={li.id} className="border-b">
                <td className="px-4 py-3 font-mono">{li.sku ?? '—'}</td>
                <td className="px-4 py-3">{li.product_name ?? '—'}</td>
                <td className="px-4 py-3 text-right font-mono text-red-700">-{li.qty}</td>
                {isDamaged && (
                  <td className="px-4 py-3 text-right font-mono">
                    ${parseFloat(li.unit_cost_snapshot ?? '0').toFixed(4)}
                  </td>
                )}
                {isDamaged && (
                  <td className="px-4 py-3 text-right font-mono">
                    ${(li.qty * parseFloat(li.unit_cost_snapshot ?? '0')).toFixed(2)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
