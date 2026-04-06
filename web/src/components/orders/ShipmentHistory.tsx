import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { orderApi } from '../../services/orderApi';
import { Shipment } from '../../types/order';

interface Props {
  orderId: number;
}

export default function ShipmentHistory({ orderId }: Props) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['orderShipments', orderId],
    queryFn: () => orderApi.getShipments(orderId),
  });

  const shipments: Shipment[] = data?.data?.data ?? data?.data ?? [];

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString();

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Shipment History</h2>

      {isLoading && <div className="text-gray-500 py-4 text-center text-sm">Loading shipments...</div>}
      {isError && <div className="text-red-600 py-4 text-center text-sm">Error loading shipments.</div>}

      {!isLoading && !isError && shipments.length === 0 && (
        <div className="text-gray-500 py-4 text-center text-sm">No shipments yet.</div>
      )}

      {!isLoading && !isError && shipments.length > 0 && (
        <div className="space-y-2">
          {shipments.map((shipment) => (
            <ShipmentRow
              key={shipment.id}
              shipment={shipment}
              expanded={expandedId === shipment.id}
              onToggle={() => toggleExpand(shipment.id)}
              formatDate={formatDate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ShipmentRowProps {
  shipment: Shipment;
  expanded: boolean;
  onToggle: () => void;
  formatDate: (d: string) => string;
}

function ShipmentRow({ shipment, expanded, onToggle, formatDate }: ShipmentRowProps) {
  const lineItems = shipment.line_items ?? [];

  return (
    <div className="border border-gray-200 rounded">
      <button
        onClick={onToggle}
        className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-gray-50"
      >
        <div className="flex gap-6 text-sm">
          <span className="text-gray-800 font-medium">Shipment #{shipment.id}</span>
          <span className="text-gray-600">Tracking: {shipment.tracking_number || '\u2014'}</span>
          <span className="text-gray-600">Batch: {shipment.batch_id || '\u2014'}</span>
          <span className="text-gray-600">By: {shipment.shipped_by}</span>
          <span className="text-gray-500">{formatDate(shipment.created_at)}</span>
        </div>
        <span className="text-gray-400 text-sm">{expanded ? '\u25B2' : '\u25BC'}</span>
      </button>

      {expanded && (
        <div className="border-t px-4 py-3">
          {lineItems.length === 0 && (
            <div className="text-gray-500 text-sm py-2">No line items.</div>
          )}
          {lineItems.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left">
                  <th className="px-3 py-2 font-medium text-gray-600">SKU</th>
                  <th className="px-3 py-2 font-medium text-gray-600">Product Name</th>
                  <th className="px-3 py-2 font-medium text-gray-600 text-right">Shipped Qty</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((li) => (
                  <tr key={li.id} className="border-b last:border-b-0">
                    <td className="px-3 py-2 font-mono text-gray-800">{li.sku || '\u2014'}</td>
                    <td className="px-3 py-2 text-gray-800">{li.product_name || '\u2014'}</td>
                    <td className="px-3 py-2 text-right text-gray-800">{li.shipped_qty}</td>
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
