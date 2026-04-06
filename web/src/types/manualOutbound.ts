export interface ManualOutbound {
  id: number;
  outbound_type: string;
  reason_text: string | null;
  reference_number: string | null;
  created_by: string;
  created_at: string;
  claim_status: string;
  credit_amount: string | null;
  credited_at: string | null;
  credited_by: string | null;
  manufacturer_reference: string | null;
  claim_notes: string | null;
  line_items?: ManualOutboundLineItem[];
}

export interface ManualOutboundLineItem {
  id: number;
  manual_outbound_id: number;
  product_id: number;
  qty: number;
  unit_cost_snapshot: string | null;
  sku?: string;
  product_name?: string;
  created_at: string;
}

export interface DamagedReportEntry {
  id: number;
  qty: number;
  unit_cost_snapshot: string;
  total_cost: string;
  created_at: string;
  outbound_id: number;
  reference_number: string | null;
  created_by: string;
  claim_status: string;
  credit_amount: string | null;
  credited_at: string | null;
  credited_by: string | null;
  manufacturer_reference: string | null;
  claim_notes: string | null;
  sku: string;
  product_name: string;
}
