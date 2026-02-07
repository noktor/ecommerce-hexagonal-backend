import { useState } from 'react';
import { api, Order } from '../services/api';

interface OrderFormProps {
  items: Array<{ productId: string; quantity: number }>;
  onOrderCreated: (order: Order) => void;
  onCancel: () => void;
}

export function OrderForm({ items, onOrderCreated, onCancel }: OrderFormProps) {
  const [shippingAddress, setShippingAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!shippingAddress.trim()) {
      setError('Shipping address is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const order = await api.orders.create(items, shippingAddress);
      onOrderCreated(order);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px' }}>
      <h2>Complete Order</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Shipping Address:
          </label>
          <textarea
            value={shippingAddress}
            onChange={(e) => setShippingAddress(e.target.value)}
            placeholder="Enter shipping address"
            rows={4}
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '14px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontFamily: 'inherit'
            }}
            required
          />
        </div>
        {error && (
          <div style={{ color: 'red', marginBottom: '16px', fontSize: '14px' }}>
            {error}
          </div>
        )}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: loading ? '#ccc' : '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            {loading ? 'Creating order...' : 'Create Order'}
          </button>
        </div>
      </form>
    </div>
  );
}

