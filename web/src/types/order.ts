export interface Order {
  id: number;
  order_number: string;
  external_order_id: string | null;
  source: string;
  status: string;
  customer_name: string | null;
  order_date: string | null;
  import_date: string;
  ship_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  line_items?: OrderLineItem[];
}

export interface OrderLineItem {
  id: number;
  order_id: number;
  product_id: number | null;
  external_sku: string | null;
  product_name_external: string | null;
  ordered_qty: number;
  shipped_qty: number;
  line_status: string;
  is_matched: boolean;
  sku?: string;
  product_name?: string;
  qty_on_hand?: number;
  created_at: string;
  updated_at: string;
}

export interface Shipment {
  id: number;
  order_id: number;
  tracking_number: string | null;
  batch_id: string | null;
  shipped_by: string;
  created_at: string;
  line_items?: ShipmentLineItem[];
}

export interface ShipmentLineItem {
  id: number;
  shipment_id: number;
  order_line_item_id: number;
  product_id: number;
  shipped_qty: number;
  sku?: string;
  product_name?: string;
  created_at: string;
}
