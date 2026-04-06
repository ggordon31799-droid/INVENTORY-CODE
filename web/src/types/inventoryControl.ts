export interface Adjustment {
  id: number;
  product_id: number;
  previous_qty: number;
  new_qty: number;
  qty_delta: number;
  reason: string;
  notes: string | null;
  cycle_count_id: number | null;
  adjusted_by: string;
  created_at: string;
  sku?: string;
  product_name?: string;
}

export interface CycleCount {
  id: number;
  status: string;
  scope_type: string | null;
  scope_value: string | null;
  total_skus: number;
  discrepancy_count: number;
  adjustments_made: number;
  counted_by: string;
  created_at: string;
  completed_at: string | null;
  lines?: CycleCountLine[];
}

export interface CycleCountLine {
  id: number;
  cycle_count_id: number;
  product_id: number;
  system_qty: number;
  counted_qty: number | null;
  variance: number | null;
  accepted: boolean;
  adjustment_id: number | null;
  sku?: string;
  product_name?: string;
  location?: string;
}

export interface Transfer {
  id: number;
  product_id: number;
  from_location: string | null;
  to_location: string;
  transferred_by: string;
  created_at: string;
  sku?: string;
  product_name?: string;
}
