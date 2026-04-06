import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { manualOutboundApi } from '../../services/manualOutboundApi';
import { DamagedReportEntry } from '../../types/manualOutbound';

const CLAIM_BADGE: Record<string, { bg: string; label: string }> = {
  open: { bg: 'bg-blue-100 text-blue-800', label: 'Open' },
  submitted: { bg: 'bg-amber-100 text-amber-800', label: 'Submitted' },
  credited: { bg: 'bg-green-100 text-green-800', label: 'Credited' },
  closed: { bg: 'bg-gray-100 text-gray-600', label: 'Closed' },
};

function claimBadge(status: string) {
  const entry = CLAIM_BADGE[status] ?? { bg: 'bg-gray-100 text-gray-600', label: status };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${entry.bg}`}>
      {entry.label}
    </span>
  );
}

export default function DamagedReport() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditBy, setCreditBy] = useState('admin');
  const [mfgRef, setMfgRef] = useState('');
  const [claimNotes, setClaimNotes] = useState('');
  const pageSize = 20;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['damagedReport', page],
    queryFn: () => manualOutboundApi.damagedReport({ page, limit: pageSize }),
  });

  const entries: DamagedReportEntry[] = data?.data?.data ?? [];
  const total: number = data?.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const totalDamagedValue: number = data?.data?.total_damaged_value ?? 0;

  const statusMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Record<string, any> }) =>
      manualOutboundApi.updateClaimStatus(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['damagedReport'] });
    },
  });

  const creditMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Record<string, any> }) =>
      manualOutboundApi.applyCredit(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['damagedReport'] });
      setEditingId(null);
    },
  });

  const openCreditForm = (entry: DamagedReportEntry) => {
    setEditingId(entry.outbound_id);
    setCreditAmount(entry.credit_amount ? parseFloat(entry.credit_amount).toFixed(2) : parseFloat(entry.total_cost).toFixed(2));
    setCreditBy('admin');
    setMfgRef(entry.manufacturer_reference ?? '');
    setClaimNotes(entry.claim_notes ?? '');
  };

  const submitCredit = (outboundId: number) => {
    const amt = parseFloat(creditAmount);
    if (isNaN(amt) || amt <= 0) return;
    creditMutation.mutate({
      id: outboundId,
      payload: {
        credit_amount: amt,
        credited_by: creditBy.trim() || 'admin',
        manufacturer_reference: mfgRef.trim() || null,
        claim_notes: claimNotes.trim() || null,
      },
    });
  };

  const totalCredited = entries.reduce(
    (sum, e) => sum + (e.credit_amount ? parseFloat(e.credit_amount) : 0),
    0
  );

  return (
    <div>
      {isLoading && <div className="text-gray-500 py-8 text-center">Loading...</div>}
      {isError && <div className="text-red-600 py-8 text-center">Error loading damaged report.</div>}

      {!isLoading && !isError && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded">
              <div className="text-xs font-medium text-red-600 uppercase">Total Damaged Value</div>
              <div className="text-lg font-mono font-bold text-red-800">${totalDamagedValue.toFixed(2)}</div>
            </div>
            <div className="p-4 bg-green-50 border border-green-200 rounded">
              <div className="text-xs font-medium text-green-600 uppercase">Total Credited</div>
              <div className="text-lg font-mono font-bold text-green-800">${totalCredited.toFixed(2)}</div>
            </div>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded">
              <div className="text-xs font-medium text-amber-600 uppercase">Open Balance</div>
              <div className="text-lg font-mono font-bold text-amber-800">${(totalDamagedValue - totalCredited).toFixed(2)}</div>
            </div>
          </div>

          {entries.length === 0 ? (
            <p className="text-sm text-gray-500">No damaged inventory records.</p>
          ) : (
            <div className="overflow-x-auto bg-white rounded shadow">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left">
                    <th className="px-3 py-3 font-medium text-gray-600">Date</th>
                    <th className="px-3 py-3 font-medium text-gray-600">SKU</th>
                    <th className="px-3 py-3 font-medium text-gray-600">Product</th>
                    <th className="px-3 py-3 font-medium text-gray-600 text-right">Qty</th>
                    <th className="px-3 py-3 font-medium text-gray-600 text-right">Damage Value</th>
                    <th className="px-3 py-3 font-medium text-gray-600">Claim</th>
                    <th className="px-3 py-3 font-medium text-gray-600 text-right">Credit</th>
                    <th className="px-3 py-3 font-medium text-gray-600 text-right">Open</th>
                    <th className="px-3 py-3 font-medium text-gray-600">Mfg Ref</th>
                    <th className="px-3 py-3 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => {
                    const damageVal = parseFloat(entry.total_cost);
                    const creditVal = entry.credit_amount ? parseFloat(entry.credit_amount) : 0;
                    const openBal = damageVal - creditVal;
                    const isEditing = editingId === entry.outbound_id;

                    return (
                      <tr key={entry.id} className="border-b">
                        <td className="px-3 py-3 text-gray-600">{new Date(entry.created_at).toLocaleDateString()}</td>
                        <td className="px-3 py-3 font-mono">{entry.sku}</td>
                        <td className="px-3 py-3">{entry.product_name}</td>
                        <td className="px-3 py-3 text-right font-mono text-red-700">{entry.qty}</td>
                        <td className="px-3 py-3 text-right font-mono">${damageVal.toFixed(2)}</td>
                        <td className="px-3 py-3">{claimBadge(entry.claim_status)}</td>
                        <td className="px-3 py-3 text-right font-mono text-green-700">
                          {creditVal > 0 ? `$${creditVal.toFixed(2)}` : '—'}
                        </td>
                        <td className="px-3 py-3 text-right font-mono">
                          <span className={openBal > 0 ? 'text-amber-700' : 'text-gray-400'}>
                            ${openBal.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-gray-600 font-mono text-xs">
                          {entry.manufacturer_reference ?? '—'}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex gap-1 flex-wrap">
                            {entry.claim_status === 'open' && (
                              <button
                                onClick={() => statusMutation.mutate({
                                  id: entry.outbound_id,
                                  payload: { claim_status: 'submitted' },
                                })}
                                disabled={statusMutation.isPending}
                                className="px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded hover:bg-amber-200"
                              >
                                Submit
                              </button>
                            )}
                            {(entry.claim_status === 'open' || entry.claim_status === 'submitted') && (
                              <button
                                onClick={() => openCreditForm(entry)}
                                className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200"
                              >
                                Credit
                              </button>
                            )}
                            {entry.claim_status !== 'closed' && entry.claim_status !== 'open' && (
                              <button
                                onClick={() => statusMutation.mutate({
                                  id: entry.outbound_id,
                                  payload: { claim_status: 'closed' },
                                })}
                                disabled={statusMutation.isPending}
                                className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                              >
                                Close
                              </button>
                            )}
                          </div>

                          {/* Inline credit form */}
                          {isEditing && (
                            <div className="mt-2 p-2 border rounded bg-gray-50 space-y-2">
                              <div>
                                <label className="block text-xs text-gray-500">Credit Amount</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0.01"
                                  value={creditAmount}
                                  onChange={(e) => setCreditAmount(e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-500">Credited By</label>
                                <input
                                  type="text"
                                  value={creditBy}
                                  onChange={(e) => setCreditBy(e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-500">Manufacturer Ref</label>
                                <input
                                  type="text"
                                  value={mfgRef}
                                  onChange={(e) => setMfgRef(e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-500">Notes</label>
                                <input
                                  type="text"
                                  value={claimNotes}
                                  onChange={(e) => setClaimNotes(e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                                />
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => submitCredit(entry.outbound_id)}
                                  disabled={creditMutation.isPending}
                                  className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                                >
                                  {creditMutation.isPending ? 'Saving...' : 'Apply Credit'}
                                </button>
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="px-2 py-1 text-xs border rounded hover:bg-gray-100"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1 border rounded text-sm disabled:opacity-40 hover:bg-gray-100">Previous</button>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1 border rounded text-sm disabled:opacity-40 hover:bg-gray-100">Next</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
