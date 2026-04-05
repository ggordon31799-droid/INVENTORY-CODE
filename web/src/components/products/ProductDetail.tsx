import { useQuery } from '@tanstack/react-query';
import { productApi } from '../../services/productApi';
import { Product } from '../../types/product';
import IntegrationMappings from './IntegrationMappings';
import CostHistory from './CostHistory';
import LedgerHistory from './LedgerHistory';

interface Props {
  productId: number;
  onBack: () => void;
  onEdit: (id: number) => void;
}

export default function ProductDetail({ productId, onBack, onEdit }: Props) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => productApi.get(productId),
  });

  const product: Product | undefined = data?.data?.data ?? data?.data;

  const formatCurrency = (value: string) => `$${parseFloat(value).toFixed(2)}`;

  if (isLoading) {
    return (
      <div className="text-gray-500 py-8 text-center">Loading product...</div>
    );
  }

  if (isError) {
    return (
      <div>
        <button
          onClick={onBack}
          className="mb-4 px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-100"
        >
          &larr; Back to Products
        </button>
        <div className="text-red-600 py-8 text-center">
          Error loading product: {(error as Error).message}
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div>
        <button
          onClick={onBack}
          className="mb-4 px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-100"
        >
          &larr; Back to Products
        </button>
        <div className="text-gray-500 py-8 text-center">Product not found.</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-100"
          >
            &larr; Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {product.product_name}
            </h1>
            <p className="text-sm text-gray-500 font-mono">{product.sku}</p>
          </div>
          <span
            className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
              product.status === 'active'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {product.status === 'active' ? 'Active' : 'Inactive'}
          </span>
        </div>
        <button
          onClick={() => onEdit(product.id)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
        >
          Edit Product
        </button>
      </div>

      {/* Info Section */}
      <div className="bg-white rounded shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Product Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              SKU
            </dt>
            <dd className="mt-1 text-sm text-gray-900 font-mono">{product.sku}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Product Name
            </dt>
            <dd className="mt-1 text-sm text-gray-900">{product.product_name}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Barcode
            </dt>
            <dd className="mt-1 text-sm text-gray-900 font-mono">
              {product.barcode ?? '\u2014'}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Category
            </dt>
            <dd className="mt-1 text-sm text-gray-900">
              {product.category ?? '\u2014'}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Location
            </dt>
            <dd className="mt-1 text-sm text-gray-900">
              {product.location ?? '\u2014'}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Status
            </dt>
            <dd className="mt-1 text-sm">
              <span
                className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                  product.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {product.status === 'active' ? 'Active' : 'Inactive'}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Qty on Hand
            </dt>
            <dd className="mt-1 text-sm text-gray-900 font-mono">
              {product.qty_on_hand}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Weighted Avg Cost
            </dt>
            <dd className="mt-1 text-sm text-gray-900 font-mono">
              {formatCurrency(product.weighted_avg_cost)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Total Value
            </dt>
            <dd className="mt-1 text-sm text-gray-900 font-mono">
              {formatCurrency(product.total_value)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Reorder Threshold
            </dt>
            <dd className="mt-1 text-sm text-gray-900">{product.reorder_threshold}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Created
            </dt>
            <dd className="mt-1 text-sm text-gray-600">
              {new Date(product.created_at).toLocaleDateString()}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Last Updated
            </dt>
            <dd className="mt-1 text-sm text-gray-600">
              {new Date(product.updated_at).toLocaleDateString()}
            </dd>
          </div>
        </div>

        {product.notes && (
          <div className="mt-4 pt-4 border-t">
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Notes
            </dt>
            <dd className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
              {product.notes}
            </dd>
          </div>
        )}
      </div>

      {/* Integration Mappings */}
      <div className="bg-white rounded shadow p-6 mb-6">
        <IntegrationMappings productId={product.id} />
      </div>

      {/* Cost History */}
      <div className="bg-white rounded shadow p-6 mb-6">
        <CostHistory productId={product.id} />
      </div>

      {/* Inventory Ledger */}
      <div className="bg-white rounded shadow p-6">
        <LedgerHistory productId={product.id} />
      </div>
    </div>
  );
}
