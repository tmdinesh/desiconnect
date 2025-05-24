import React, { createContext, useContext, useEffect, useState } from 'react';
import { getCart } from '@/lib/api';
import { useAuth } from './use-auth';

type CartItem = {
  productId: number;
  quantity: number;
  message?: string;
};

type CartContextType = {
  cartItems: CartItem[];
  cartCount: number;
  isLoading: boolean;
  refetchCart: () => Promise<void>;
};

const CartContext = createContext<CartContextType>({
  cartItems: [],
  cartCount: 0,
  isLoading: false,
  refetchCart: async () => {},
});

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  const fetchCartData = async () => {
    if (!isAuthenticated) {
      setCartItems([]);
      return;
    }

    setIsLoading(true);
    try {
      // Get token from localStorage for authentication
      const token = localStorage.getItem('desiconnect_token');
      
      if (!token) {
        console.error('No authentication token found');
        setCartItems([]);
        return;
      }
      
      // Use API with proper authentication
      const cartData = await getCart();
      
      // Handle empty or invalid cart data
      if (!cartData || !cartData.items) {
        console.warn('Invalid cart data structure:', cartData);
        setCartItems([]);
      } else {
        setCartItems(cartData.items);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      setCartItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch cart data on initial load and when authentication state changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchCartData();
    }
  }, [isAuthenticated]);

  // Calculate the total number of items in the cart
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        isLoading,
        refetchCart: fetchCartData,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);