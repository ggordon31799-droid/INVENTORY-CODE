import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import ProductList from '../components/products/ProductList';
import ProductDetail from '../components/products/ProductDetail';
import ProductForm from '../components/products/ProductForm';
import { productApi } from '../services/productApi';
import { Product } from '../types/product';

type View =
  | { name: 'list' }
  | { name: 'detail'; id: number }
  | { name: 'create' }
  | { name: 'edit'; id: number };

export default function Products() {
  const [view, setView] = useState<View>({ name: 'list' });

  // Pre-fetch product data for edit view
  const editProductQuery = useQuery({
    queryKey: ['product', view.name === 'edit' ? (view as { name: 'edit'; id: number }).id : null],
    queryFn: () => {
      if (view.name !== 'edit') return null;
      return productApi.get((view as { name: 'edit'; id: number }).id);
    },
    enabled: view.name === 'edit',
  });

  if (view.name === 'list') {
    return (
      <ProductList
        onSelect={(id) => setView({ name: 'detail', id })}
        onCreate={() => setView({ name: 'create' })}
      />
    );
  }

  if (view.name === 'detail') {
    return (
      <ProductDetail
        productId={view.id}
        onBack={() => setView({ name: 'list' })}
        onEdit={(id) => setView({ name: 'edit', id })}
      />
    );
  }

  if (view.name === 'create') {
    return (
      <ProductForm
        onSave={() => setView({ name: 'list' })}
        onCancel={() => setView({ name: 'list' })}
      />
    );
  }

  if (view.name === 'edit') {
    const product: Product | undefined =
      editProductQuery.data?.data?.data ?? editProductQuery.data?.data;

    if (editProductQuery.isLoading) {
      return (
        <div className="text-gray-500 py-8 text-center">Loading product...</div>
      );
    }

    if (editProductQuery.isError || !product) {
      return (
        <div>
          <button
            onClick={() => setView({ name: 'detail', id: view.id })}
            className="mb-4 px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-100"
          >
            &larr; Back
          </button>
          <div className="text-red-600 py-8 text-center">
            Error loading product for editing.
          </div>
        </div>
      );
    }

    return (
      <ProductForm
        product={product}
        onSave={() => setView({ name: 'detail', id: view.id })}
        onCancel={() => setView({ name: 'detail', id: view.id })}
      />
    );
  }

  return null;
}
