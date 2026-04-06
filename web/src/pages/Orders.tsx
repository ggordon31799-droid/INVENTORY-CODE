import { useState } from 'react';
import OrderList from '../components/orders/OrderList';
import OrderDetail from '../components/orders/OrderDetail';
import OrderForm from '../components/orders/OrderForm';

type View =
  | { name: 'list' }
  | { name: 'detail'; id: number }
  | { name: 'create' };

export default function Orders() {
  const [view, setView] = useState<View>({ name: 'list' });

  if (view.name === 'list') {
    return (
      <OrderList
        onSelect={(id) => setView({ name: 'detail', id })}
        onCreate={() => setView({ name: 'create' })}
      />
    );
  }

  if (view.name === 'detail') {
    return (
      <OrderDetail
        orderId={view.id}
        onBack={() => setView({ name: 'list' })}
      />
    );
  }

  if (view.name === 'create') {
    return (
      <OrderForm
        onSave={(newId) => setView({ name: 'detail', id: newId })}
        onCancel={() => setView({ name: 'list' })}
      />
    );
  }

  return null;
}
