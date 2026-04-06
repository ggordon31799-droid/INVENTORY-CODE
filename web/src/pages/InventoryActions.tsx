import { useState } from 'react';
import OutboundForm from '../components/inventoryActions/OutboundForm';
import OutboundList from '../components/inventoryActions/OutboundList';
import OutboundDetail from '../components/inventoryActions/OutboundDetail';
import DamagedReport from '../components/inventoryActions/DamagedReport';

type View =
  | { name: 'home' }
  | { name: 'outbound-form' }
  | { name: 'outbound-list' }
  | { name: 'outbound-detail'; id: number }
  | { name: 'damaged-report' };

export default function InventoryActions() {
  const [view, setView] = useState<View>({ name: 'home' });

  if (view.name === 'outbound-form') {
    return (
      <OutboundForm
        onComplete={() => setView({ name: 'outbound-list' })}
        onCancel={() => setView({ name: 'home' })}
      />
    );
  }

  if (view.name === 'outbound-list') {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Outbound History</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setView({ name: 'outbound-form' })}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium"
            >
              New Outbound
            </button>
            <button
              onClick={() => setView({ name: 'home' })}
              className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-100"
            >
              &larr; Back
            </button>
          </div>
        </div>
        <OutboundList onSelect={(id) => setView({ name: 'outbound-detail', id })} />
      </div>
    );
  }

  if (view.name === 'outbound-detail') {
    return (
      <OutboundDetail
        outboundId={view.id}
        onBack={() => setView({ name: 'outbound-list' })}
      />
    );
  }

  if (view.name === 'damaged-report') {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Damaged Inventory Report</h1>
          <button
            onClick={() => setView({ name: 'home' })}
            className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-100"
          >
            &larr; Back
          </button>
        </div>
        <DamagedReport />
      </div>
    );
  }

  // Home view
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Inventory Actions</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
        <button
          onClick={() => setView({ name: 'outbound-form' })}
          className="p-6 bg-white rounded shadow hover:shadow-md text-left"
        >
          <h2 className="text-lg font-semibold text-gray-900">Manual Outbound</h2>
          <p className="text-sm text-gray-500 mt-1">
            Remove inventory: FBA, Amazon, damaged, samples, internal use
          </p>
        </button>

        <button
          onClick={() => setView({ name: 'outbound-list' })}
          className="p-6 bg-white rounded shadow hover:shadow-md text-left"
        >
          <h2 className="text-lg font-semibold text-gray-900">Outbound History</h2>
          <p className="text-sm text-gray-500 mt-1">
            View all manual outbound records
          </p>
        </button>

        <button
          onClick={() => setView({ name: 'damaged-report' })}
          className="p-6 bg-white rounded shadow hover:shadow-md text-left"
        >
          <h2 className="text-lg font-semibold text-gray-900">Damaged Report</h2>
          <p className="text-sm text-gray-500 mt-1">
            View damaged inventory with cost basis for supplier credits
          </p>
        </button>

        <div className="p-6 bg-gray-50 rounded border border-dashed border-gray-300 text-left opacity-60">
          <h2 className="text-lg font-semibold text-gray-500">Cycle Counts</h2>
          <p className="text-sm text-gray-400 mt-1">Coming soon</p>
        </div>

        <div className="p-6 bg-gray-50 rounded border border-dashed border-gray-300 text-left opacity-60">
          <h2 className="text-lg font-semibold text-gray-500">Adjustments</h2>
          <p className="text-sm text-gray-400 mt-1">Coming soon</p>
        </div>

        <div className="p-6 bg-gray-50 rounded border border-dashed border-gray-300 text-left opacity-60">
          <h2 className="text-lg font-semibold text-gray-500">Transfers</h2>
          <p className="text-sm text-gray-400 mt-1">Coming soon</p>
        </div>
      </div>
    </div>
  );
}
