export interface PurchaseOrder {
  id: number;
  po_number: string;
  supplier: string;
  status: string;
  expected_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  line_items?: POLineItem[];
}

export interface POLineItem {
  id: number;
  purchase_order_id: number;
  product_id: number;
  ordered_qty: number;
  unit_cost: string;
  received_qty: number;
  line_status: string;
  sku?: string;
  product_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Receipt {
  id: number;
  purchase_order_id: number;
  bol_number: string | null;
  received_by: string;
  created_at: string;
  line_items?: ReceiptLineItem[];
}

export interface ReceiptLineItem {
  id: number;
  receipt_id: number;
  po_line_item_id: number;
  product_id: number;
  received_qty: number;
  unit_cost: string;
  sku?: string;
  product_name?: string;
  created_at: string;
}
