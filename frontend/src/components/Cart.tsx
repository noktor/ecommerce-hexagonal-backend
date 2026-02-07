import { useState, useEffect } from 'react';
import { api, Cart as CartType, Product } from '../services/api';

interface CartProps {
  onCheckout: (items: Array<{ productId: string; quantity: number }>) => void;
}

export function Cart({ onCheckout }: CartProps) {
  const [cart, setCart] = useState<CartType | null>(null);
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      setLoading(true);
      setError(null);
      const cartData = await api.cart.getByCustomerId();
      setCart(cartData);

      // Load product details for cart items
      if (cartData.items.length > 0) {
        const productPromises = cartData.items.map(item =>
          api.products.getById(item.productId)
        );
        const productData = await Promise.all(productPromises);
        const productMap: Record<string, Product> = {};
        productData.forEach(product => {
          productMap[product.id] = product;
        });
        setProducts(productMap);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading cart');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = () => {
    if (cart && cart.items.length > 0) {
      onCheckout(cart.items);
    }
  };

  const handleRemoveItem = async (productId: string) => {
    try {
      await api.cart.removeItem(productId);
      await loadCart(); // Reload cart after removing item
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading cart...</div>;
  }

  if (error) {
    return <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>Cart</h2>
        <p>Your cart is empty</p>
      </div>
    );
  }

  const total = cart.items.reduce((sum, item) => {
    const product = products[item.productId];
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Cart</h2>
      <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '16px' }}>
        {cart.items.map((item) => {
          const product = products[item.productId];
          if (!product) return null;

          return (
            <div
              key={item.productId}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                borderBottom: '1px solid #eee'
              }}
            >
              <div style={{ flex: 1 }}>
                <strong>{product.name}</strong>
                <p style={{ margin: '4px 0', fontSize: '14px', color: '#666' }}>
                  Quantity: {item.quantity} × ${product.price.toFixed(2)}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                  ${(product.price * item.quantity).toFixed(2)}
                </div>
                <button
                  onClick={() => handleRemoveItem(item.productId)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                  title="Remove from cart"
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
        <div
          style={{
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '2px solid #2563eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <strong style={{ fontSize: '20px' }}>Total:</strong>
          <strong style={{ fontSize: '24px', color: '#2563eb' }}>${total.toFixed(2)}</strong>
        </div>
        <button
          onClick={handleCheckout}
          style={{
            marginTop: '16px',
            width: '100%',
            padding: '12px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Checkout
        </button>
      </div>
    </div>
  );
}

