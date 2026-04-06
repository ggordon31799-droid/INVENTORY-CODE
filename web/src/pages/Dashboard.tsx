import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../services/dashboardApi';

function formatCurrency(value: number) {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const EVENT_LABELS: Record<string, string> = {
  receipt: 'Receipt',
  shipment: 'Shipment',
  manual_outbound: 'Manual Outbound',
  adjustment: 'Adjustment',
  cycle_count_adjustment: 'Cycle Count',
};

export default function Dashboard() {
  const summaryQ = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => dashboardApi.summary(),
    refetchInterval: 30000,
  });

  const alertsQ = useQuery({
    queryKey: ['dashboard', 'alerts'],
    queryFn: () => dashboardApi.alerts(),
    refetchInterval: 60000,
  });

  const activityQ = useQuery({
    queryKey: ['dashboard', 'activity'],
    queryFn: () => dashboardApi.activity({ limit: 25 }),
    refetchInterval: 30000,
  });

  const todaysWorkQ = useQuery({
    queryKey: ['dashboard', 'todaysWork'],
    queryFn: () => dashboardApi.todaysWork(),
    refetchInterval: 30000,
  });

  const summary = summaryQ.data?.data;
  const alerts = alertsQ.data?.data;
  const activity: any[] = activityQ.data?.data ?? [];
  const todaysOrders: any[] = todaysWorkQ.data?.data ?? [];

  const totalAlerts =
    (alerts?.low_stock?.length ?? 0) +
    (alerts?.negative_inventory?.length ?? 0) +
    (alerts?.unmatched_skus?.length ?? 0) +
    (alerts?.overdue_purchase_orders?.length ?? 0) +
    (alerts?.open_damaged_claims?.length ?? 0);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded shadow p-4">
          <div className="text-xs font-medium text-gray-500 uppercase">Active SKUs</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {summary?.total_skus ?? '—'}
          </div>
        </div>
        <div className="bg-white rounded shadow p-4">
          <div className="text-xs font-medium text-gray-500 uppercase">Total Units</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {summary ? summary.total_units.toLocaleString() : '—'}
          </div>
        </div>
        <div className="bg-white rounded shadow p-4">
          <div className="text-xs font-medium text-gray-500 uppercase">Inventory Value</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {summary ? formatCurrency(summary.total_inventory_value) : '—'}
          </div>
        </div>
        <div className="bg-white rounded shadow p-4">
          <div className="text-xs font-medium text-green-600 uppercase">Received Today</div>
          <div className="text-2xl font-bold text-green-700 mt-1">
            {summary ? `+${summary.units_received_today.toLocaleString()}` : '—'}
          </div>
        </div>
        <div className="bg-white rounded shadow p-4">
          <div className="text-xs font-medium text-blue-600 uppercase">Shipped Today</div>
          <div className="text-2xl font-bold text-blue-700 mt-1">
            {summary ? summary.units_shipped_today.toLocaleString() : '—'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Alerts + Today's Work */}
        <div className="space-y-6">
          {/* Alerts Panel */}
          <div className="bg-white rounded shadow p-5">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Alerts {totalAlerts > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                  {totalAlerts}
                </span>
              )}
            </h2>

            {alertsQ.isLoading && <p className="text-sm text-gray-500">Loading...</p>}

            {alerts && totalAlerts === 0 && (
              <p className="text-sm text-gray-500">No alerts. All clear.</p>
            )}

            {alerts?.low_stock?.length > 0 && (
              <div className="mb-3">
                <h3 className="text-sm font-medium text-amber-700 mb-1">Low Stock ({alerts.low_stock.length})</h3>
                <div className="space-y-1">
                  {alerts.low_stock.slice(0, 5).map((item: any) => (
                    <div key={item.id} className="text-sm flex justify-between px-2 py-1 bg-amber-50 rounded">
                      <span className="font-mono">{item.sku}</span>
                      <span className="text-amber-800">{item.qty_on_hand} / {item.reorder_threshold}</span>
                    </div>
                  ))}
                  {alerts.low_stock.length > 5 && (
                    <p className="text-xs text-gray-500 px-2">+{alerts.low_stock.length - 5} more</p>
                  )}
                </div>
              </div>
            )}

            {alerts?.negative_inventory?.length > 0 && (
              <div className="mb-3">
                <h3 className="text-sm font-medium text-red-700 mb-1">Negative Inventory ({alerts.negative_inventory.length})</h3>
                <div className="space-y-1">
                  {alerts.negative_inventory.map((item: any) => (
                    <div key={item.id} className="text-sm flex justify-between px-2 py-1 bg-red-50 rounded">
                      <span className="font-mono">{item.sku}</span>
                      <span className="text-red-800 font-mono">{item.qty_on_hand}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {alerts?.unmatched_skus?.length > 0 && (
              <div className="mb-3">
                <h3 className="text-sm font-medium text-purple-700 mb-1">Unmatched SKUs ({alerts.unmatched_skus.length})</h3>
                <div className="space-y-1">
                  {alerts.unmatched_skus.slice(0, 5).map((item: any) => (
                    <div key={item.line_id} className="text-sm flex justify-between px-2 py-1 bg-purple-50 rounded">
                      <span className="font-mono">{item.external_sku ?? 'unknown'}</span>
                      <span className="text-purple-700">{item.order_number}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {alerts?.overdue_purchase_orders?.length > 0 && (
              <div className="mb-3">
                <h3 className="text-sm font-medium text-orange-700 mb-1">Overdue POs ({alerts.overdue_purchase_orders.length})</h3>
                <div className="space-y-1">
                  {alerts.overdue_purchase_orders.map((item: any) => (
                    <div key={item.id} className="text-sm flex justify-between px-2 py-1 bg-orange-50 rounded">
                      <span className="font-mono">{item.po_number}</span>
                      <span className="text-orange-700">{item.supplier}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {alerts?.open_damaged_claims?.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-red-700 mb-1">Open Damaged Claims ({alerts.open_damaged_claims.length})</h3>
                <div className="space-y-1">
                  {alerts.open_damaged_claims.slice(0, 5).map((item: any) => (
                    <div key={item.id} className="text-sm flex justify-between px-2 py-1 bg-red-50 rounded">
                      <span>#{item.id}</span>
                      <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded">{item.claim_status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Today's Work */}
          <div className="bg-white rounded shadow p-5">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Today's Work
              {todaysOrders.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  {todaysOrders.length}
                </span>
              )}
            </h2>

            {todaysWorkQ.isLoading && <p className="text-sm text-gray-500">Loading...</p>}

            {todaysOrders.length === 0 && !todaysWorkQ.isLoading && (
              <p className="text-sm text-gray-500">No pending orders to ship.</p>
            )}

            {todaysOrders.length > 0 && (
              <div className="space-y-2">
                {todaysOrders.slice(0, 10).map((order: any) => {
                  const totalItems = (order.line_items ?? []).reduce(
                    (sum: number, li: any) => sum + (li.ordered_qty - li.shipped_qty), 0
                  );
                  const hasUnmatched = (order.line_items ?? []).some((li: any) => !li.is_matched);

                  return (
                    <div
                      key={order.id}
                      className="flex items-center justify-between px-3 py-2 border rounded hover:bg-blue-50"
                    >
                      <div>
                        <span className="font-mono text-sm font-medium">{order.order_number}</span>
                        {order.customer_name && (
                          <span className="text-sm text-gray-500 ml-2">{order.customer_name}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {hasUnmatched && (
                          <span className="px-1.5 py-0.5 bg-red-100 text-red-800 rounded text-xs">unmatched</span>
                        )}
                        <span className="text-sm text-gray-600">{totalItems} units</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          order.status === 'pending'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {order.status === 'pending' ? 'Pending' : 'Partial'}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {todaysOrders.length > 10 && (
                  <p className="text-xs text-gray-500 text-center">+{todaysOrders.length - 10} more orders</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recent Activity */}
        <div className="bg-white rounded shadow p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Recent Activity</h2>

          {activityQ.isLoading && <p className="text-sm text-gray-500">Loading...</p>}

          {activity.length === 0 && !activityQ.isLoading && (
            <p className="text-sm text-gray-500">No inventory activity yet.</p>
          )}

          {activity.length > 0 && (
            <div className="space-y-1">
              {activity.map((entry: any) => (
                <div key={entry.id} className="flex items-center justify-between px-2 py-1.5 text-sm border-b last:border-b-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      entry.qty_delta > 0 ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <span className="font-mono text-gray-800 truncate">{entry.sku}</span>
                    <span className="text-gray-500 hidden sm:inline truncate">{entry.product_name}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`font-mono ${
                      entry.qty_delta > 0 ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {entry.qty_delta > 0 ? '+' : ''}{entry.qty_delta}
                    </span>
                    <span className="text-xs text-gray-400 w-16 text-right">
                      {EVENT_LABELS[entry.event_type] ?? entry.event_type}
                    </span>
                    <span className="text-xs text-gray-400 w-12 text-right">{timeAgo(entry.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
