import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cycleCountApi } from '../../services/inventoryControlApi';
import { CycleCount, CycleCountLine } from '../../types/inventoryControl';

interface Props {
  countId: number;
  onBack: () => void;
}

interface ReviewResult {
  count_id: number;
  total_lines: number;
  discrepancy_count: number;
  lines: CycleCountLine[];
}

export default function CycleCountDetail({ countId, onBack }: Props) {
  const queryClient = useQueryClient();
  const [reviewData, setReviewData] = useState<ReviewResult | null>(null);
  const [acceptedLineIds, setAcceptedLineIds] = useState<Set<number>>(new Set());
  const [finalizedBy, setFinalizedBy] = useState('admin');
  const [error, setError] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['cycleCount', countId],
    queryFn: () => cycleCountApi.get(countId),
  });

  const cycleCount: CycleCount | undefined = data?.data;
  const lines: CycleCountLine[] = cycleCount?.lines ?? [];
  const isInProgress = cycleCount?.status === 'in_progress';
  const isCompleted = cycleCount?.status === 'completed';

  const updateLineMutation = useMutation({
    mutationFn: ({ lineId, counted_qty }: { lineId: number; counted_qty: number }) =>
      cycleCountApi.updateLine(countId, lineId, { counted_qty }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycleCount', countId] });
    },
    onError: (err: any) => {
      setError(err?.response?.data?.error ?? err.message);
    },
  });

  const reviewMutation = useMutation({
    mutationFn: () => cycleCountApi.review(countId),
    onSuccess: (res) => {
      const result = res?.data;
      setReviewData(result);
      // Pre-select all discrepancy lines
      const ids = new Set<number>((result.lines ?? []).map((l: CycleCountLine) => l.id));
      setAcceptedLineIds(ids);
      refetch();
    },
    onError: (err: any) => {
      setError(err?.response?.data?.error ?? err.message);
    },
  });

  const finalizeMutation = useMutation({
    mutationFn: () =>
      cycleCountApi.finalize(countId, {
        accepted_line_ids: Array.from(acceptedLineIds),
        finalized_by: finalizedBy.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycleCount', countId] });
      queryClient.invalidateQueries({ queryKey: ['cycleCounts'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['adjustments'] });
      setReviewData(null);
      refetch();
    },
    onError: (err: any) => {
      setError(err?.response?.data?.error ?? err.message);
    },
  });

  const allLinesCounted = lines.length > 0 && lines.every((l) => l.counted_qty !== null);

  const toggleAccepted = (lineId: number) => {
    setAcceptedLineIds((prev) => {
      const next = new Set(prev);
      if (next.has(lineId)) {
        next.delete(lineId);
      } else {
        next.add(lineId);
      }
      return next;
    });
  };

  const statusBadge = (status: string) => {
    if (status === 'in_progress') {
      return <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">In Progress</span>;
    }
    if (status === 'completed') {
      return <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Completed</span>;
    }
    return <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">{status}</span>;
  };

  if (isLoading) return <div className="text-gray-500 py-8 text-center">Loading...</div>;
  if (isError || !cycleCount) {
    return (
      <div>
        <button onClick={onBack} className="mb-4 px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-100">&larr; Back</button>
        <div className="text-red-600 py-8 text-center">Error loading cycle count.</div>
      </div>
    );
  }

  // Review / discrepancy report view
  if (reviewData && !isCompleted) {
    return (
      <div>
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => setReviewData(null)} className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-100">&larr; Back to Count</button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Discrepancy Report — Count #{countId}</h1>
            <p className="text-sm text-gray-500">
              {reviewData.discrepancy_count} discrepancies out of {reviewData.total_lines} lines
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{error}</div>
        )}

        {reviewData.lines.length === 0 ? (
          <div className="bg-green-50 border border-green-200 rounded p-6 text-center text-green-800">
            No discrepancies found. All counts match the system quantities.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto bg-white rounded shadow mb-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left">
                    <th className="px-4 py-3 font-medium text-gray-600 w-10">
                      <input
                        type="checkbox"
                        checked={acceptedLineIds.size === reviewData.lines.length}
                        onChange={() => {
                          if (acceptedLineIds.size === reviewData.lines.length) {
                            setAcceptedLineIds(new Set());
                          } else {
                            setAcceptedLineIds(new Set(reviewData.lines.map((l) => l.id)));
                          }
                        }}
                      />
                    </th>
                    <th className="px-4 py-3 font-medium text-gray-600">SKU</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Product</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Location</th>
                    <th className="px-4 py-3 font-medium text-gray-600 text-right">System Qty</th>
                    <th className="px-4 py-3 font-medium text-gray-600 text-right">Counted Qty</th>
                    <th className="px-4 py-3 font-medium text-gray-600 text-right">Variance</th>
                  </tr>
                </thead>
                <tbody>
                  {reviewData.lines.map((line) => (
                    <tr key={line.id} className="border-b">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={acceptedLineIds.has(line.id)}
                          onChange={() => toggleAccepted(line.id)}
                        />
                      </td>
                      <td className="px-4 py-3 font-mono">{line.sku ?? '—'}</td>
                      <td className="px-4 py-3">{line.product_name ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{line.location ?? '—'}</td>
                      <td className="px-4 py-3 text-right font-mono">{line.system_qty}</td>
                      <td className="px-4 py-3 text-right font-mono">{line.counted_qty ?? '—'}</td>
                      <td className={`px-4 py-3 text-right font-mono font-semibold ${
                        (line.variance ?? 0) > 0 ? 'text-green-700' : (line.variance ?? 0) < 0 ? 'text-red-700' : 'text-gray-600'
                      }`}>
                        {line.variance !== null ? ((line.variance > 0 ? '+' : '') + line.variance) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-white rounded shadow p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Finalized By</label>
                <input
                  type="text"
                  value={finalizedBy}
                  onChange={(e) => setFinalizedBy(e.target.value)}
                  className="w-64 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={() => finalizeMutation.mutate()}
                disabled={finalizeMutation.isPending || acceptedLineIds.size === 0}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium disabled:opacity-50"
              >
                {finalizeMutation.isPending ? 'Finalizing...' : `Finalize (${acceptedLineIds.size} accepted)`}
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // Completed view
  if (isCompleted) {
    return (
      <div>
        <div className="flex items-center gap-4 mb-6">
          <button onClick={onBack} className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-100">&larr; Back</button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cycle Count #{countId}</h1>
            <p className="text-sm text-gray-500">{new Date(cycleCount.created_at).toLocaleString()}</p>
          </div>
          {statusBadge(cycleCount.status)}
        </div>

        <div className="bg-white rounded shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase">Scope</dt>
              <dd className="mt-1 text-sm">
                {cycleCount.scope_type ? `${cycleCount.scope_type}${cycleCount.scope_value ? `: ${cycleCount.scope_value}` : ''}` : 'All'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase">Counted By</dt>
              <dd className="mt-1 text-sm">{cycleCount.counted_by}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase">Total SKUs</dt>
              <dd className="mt-1 text-sm font-mono">{cycleCount.total_skus}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase">Adjustments Made</dt>
              <dd className="mt-1 text-sm font-mono">{cycleCount.adjustments_made}</dd>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto bg-white rounded shadow">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left">
                <th className="px-4 py-3 font-medium text-gray-600">SKU</th>
                <th className="px-4 py-3 font-medium text-gray-600">Product</th>
                <th className="px-4 py-3 font-medium text-gray-600">Location</th>
                <th className="px-4 py-3 font-medium text-gray-600 text-right">System Qty</th>
                <th className="px-4 py-3 font-medium text-gray-600 text-right">Counted Qty</th>
                <th className="px-4 py-3 font-medium text-gray-600 text-right">Variance</th>
                <th className="px-4 py-3 font-medium text-gray-600 text-center">Accepted</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.id} className={`border-b ${line.variance !== null && line.variance !== 0 ? 'bg-yellow-50' : ''}`}>
                  <td className="px-4 py-3 font-mono">{line.sku ?? '—'}</td>
                  <td className="px-4 py-3">{line.product_name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{line.location ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-mono">{line.system_qty}</td>
                  <td className="px-4 py-3 text-right font-mono">{line.counted_qty ?? '—'}</td>
                  <td className={`px-4 py-3 text-right font-mono font-semibold ${
                    (line.variance ?? 0) > 0 ? 'text-green-700' : (line.variance ?? 0) < 0 ? 'text-red-700' : 'text-gray-600'
                  }`}>
                    {line.variance !== null ? ((line.variance > 0 ? '+' : '') + line.variance) : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {line.accepted ? (
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Yes</span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">No</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // In-progress counting view — system_qty is HIDDEN to prevent bias
  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-100">&larr; Back</button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cycle Count #{countId}</h1>
          <p className="text-sm text-gray-500">{new Date(cycleCount.created_at).toLocaleString()}</p>
        </div>
        {statusBadge(cycleCount.status)}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{error}</div>
      )}

      <div className="bg-white rounded shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase">Scope</dt>
            <dd className="mt-1 text-sm">
              {cycleCount.scope_type ? `${cycleCount.scope_type}${cycleCount.scope_value ? `: ${cycleCount.scope_value}` : ''}` : 'All'}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase">Counted By</dt>
            <dd className="mt-1 text-sm">{cycleCount.counted_by}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase">Progress</dt>
            <dd className="mt-1 text-sm font-mono">
              {lines.filter((l) => l.counted_qty !== null).length} / {lines.length} counted
            </dd>
          </div>
        </div>
      </div>

      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded text-sm">
        System quantities are hidden during counting to prevent bias. Enter your physical counts below.
      </div>

      <div className="overflow-x-auto bg-white rounded shadow mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left">
              <th className="px-4 py-3 font-medium text-gray-600">SKU</th>
              <th className="px-4 py-3 font-medium text-gray-600">Product</th>
              <th className="px-4 py-3 font-medium text-gray-600">Location</th>
              <th className="px-4 py-3 font-medium text-gray-600 text-right">Counted Qty</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.id} className={`border-b ${line.counted_qty !== null ? 'bg-green-50' : ''}`}>
                <td className="px-4 py-3 font-mono">{line.sku ?? '—'}</td>
                <td className="px-4 py-3">{line.product_name ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600">{line.location ?? '—'}</td>
                <td className="px-4 py-3 text-right">
                  <input
                    type="number"
                    min={0}
                    value={line.counted_qty ?? ''}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val) && val >= 0) {
                        updateLineMutation.mutate({ lineId: line.id, counted_qty: val });
                      }
                    }}
                    placeholder="—"
                    className="w-24 px-2 py-1 border border-gray-300 rounded text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => reviewMutation.mutate()}
          disabled={!allLinesCounted || reviewMutation.isPending}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
        >
          {reviewMutation.isPending ? 'Reviewing...' : 'Review'}
        </button>
        {!allLinesCounted && (
          <span className="text-sm text-gray-500 self-center">
            All lines must be counted before review
          </span>
        )}
      </div>
    </div>
  );
}
