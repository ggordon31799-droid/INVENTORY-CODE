export interface Product {
  id: number;
  sku: string;
  product_name: string;
  barcode: string | null;
  category: string | null;
  qty_on_hand: number;
  reorder_threshold: number;
  location: string | null;
  weighted_avg_cost: string;
  total_value: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface IntegrationMapping {
  id: number;
  product_id: number;
  platform: string;
  external_sku: string;
  external_name: string | null;
  created_at: string;
}

export interface LedgerEntry {
  id: number;
  product_id: number;
  qty_delta: number;
  qty_after: number;
  event_type: string;
  source_table: string;
  source_id: number;
  reference_code: string | null;
  performed_by: string;
  created_at: string;
}

export interface CostHistoryEntry {
  id: number;
  product_id: number;
  qty_delta: number;
  event_type: string;
  reference_code: string | null;
  performed_by: string;
  created_at: string;
}
