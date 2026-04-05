import { useState } from 'react';
import POList from '../components/purchaseOrders/POList';
import PODetail from '../components/purchaseOrders/PODetail';
import POForm from '../components/purchaseOrders/POForm';

type View =
  | { name: 'list' }
  | { name: 'detail'; id: number }
  | { name: 'create' };

export default function PurchaseOrders() {
  const [view, setView] = useState<View>({ name: 'list' });

  if (view.name === 'list') {
    return (
      <POList
        onSelect={(id) => setView({ name: 'detail', id })}
        onCreate={() => setView({ name: 'create' })}
      />
    );
  }

  if (view.name === 'detail') {
    return (
      <PODetail
        poId={view.id}
        onBack={() => setView({ name: 'list' })}
      />
    );
  }

  if (view.name === 'create') {
    return (
      <POForm
        onSave={(newId) => setView({ name: 'detail', id: newId })}
        onCancel={() => setView({ name: 'list' })}
      />
    );
  }

  return null;
}
