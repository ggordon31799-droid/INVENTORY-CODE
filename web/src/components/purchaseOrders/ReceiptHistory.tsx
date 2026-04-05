import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { purchaseOrderApi } from '../../services/purchaseOrderApi';
import { Receipt } from '../../types/purchaseOrder';

interface Props {
  poId: number;
}

export default function ReceiptHistory({ poId }: Props) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['poReceipts', poId],
    queryFn: () => purchaseOrderApi.getReceipts(poId),
  });

  const receipts: Receipt[] = data?.data?.data ?? data?.data ?? [];

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString();
  const formatCurrency = (value: string) => `$${parseFloat(value).toFixed(2)}`;

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Receipt History</h2>

      {isLoading && <div className="text-gray-500 py-4 text-center text-sm">Loading receipts...</div>}
      {isError && <div className="text-red-600 py-4 text-center text-sm">Error loading receipts.</div>}

      {!isLoading && !isError && receipts.length === 0 && (
        <div className="text-gray-500 py-4 text-center text-sm">No receipts yet.</div>
      )}

      {!isLoading && !isError && receipts.length > 0 && (
        <div className="space-y-2">
          {receipts.map((receipt) => (
            <ReceiptRow
              key={receipt.id}
              receipt={receipt}
              expanded={expandedId === receipt.id}
              onToggle={() => toggleExpand(receipt.id)}
              formatDate={formatDate}
              formatCurrency={formatCurrency}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ReceiptRowProps {
  receipt: Receipt;
  expanded: boolean;
  onToggle: () => void;
  formatDate: (d: string) => string;
  formatCurrency: (v: string) => string;
}

function ReceiptRow({ receipt, expanded, onToggle, formatDate, formatCurrency }: ReceiptRowProps) {
  // Fetch full receipt detail when expanded
  const { data, isLoading } = useQuery({
    queryKey: ['receipt', receipt.id],
    queryFn: () => purchaseOrderApi.getReceipt(receipt.id),
    enabled: expanded,
  });

  const detail = data?.data?.receipt ?? data?.data?.data ?? data?.data;
  const lineItems = detail?.line_items ?? receipt.line_items ?? [];

  return (
    <div className="border border-gray-200 rounded">
      <button
        onClick={onToggle}
        className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-gray-50"
      >
        <div className="flex gap-6 text-sm">
          <span className="text-gray-800 font-medium">Receipt #{receipt.id}</span>
          <span className="text-gray-600">BOL: {receipt.bol_number || '\u2014'}</span>
          <span className="text-gray-600">By: {receipt.received_by}</span>
          <span className="text-gray-500">{formatDate(receipt.created_at)}</span>
        </div>
        <span className="text-gray-400 text-sm">{expanded ? '\u25B2' : '\u25BC'}</span>
      </button>

      {expanded && (
        <div className="border-t px-4 py-3">
          {isLoading && (
            <div className="text-gray-500 text-sm py-2">Loading receipt details...</div>
          )}
          {!isLoading && lineItems.length === 0 && (
            <div className="text-gray-500 text-sm py-2">No line items.</div>
          )}
          {!isLoading && lineItems.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left">
                  <th className="px-3 py-2 font-medium text-gray-600">SKU</th>
                  <th className="px-3 py-2 font-medium text-gray-600">Product Name</th>
                  <th className="px-3 py-2 font-medium text-gray-600 text-right">Qty</th>
                  <th className="px-3 py-2 font-medium text-gray-600 text-right">Unit Cost</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((li: any) => (
                  <tr key={li.id} className="border-b last:border-b-0">
                    <td className="px-3 py-2 font-mono text-gray-800">{li.sku || '\u2014'}</td>
                    <td className="px-3 py-2 text-gray-800">{li.product_name || '\u2014'}</td>
                    <td className="px-3 py-2 text-right text-gray-800">{li.received_qty}</td>
                    <td className="px-3 py-2 text-right text-gray-800">{formatCurrency(li.unit_cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
