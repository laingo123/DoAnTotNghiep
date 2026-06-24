import React, { createContext, useContext, useState, ReactNode } from 'react';
import Toast from 'react-native-root-toast';

const MAX_QUANTITY = 50;

// Define the type for the cart items
type CartItems = {
  [key: string]: number;  // key is the product ID, value is the quantity
};

interface CartContextType {
  cartItems: CartItems;
  addToCart: (itemKey: string, quantity: number) => void;
  SetQuantityCart: (itemKey: string, delta: number) => void;
  emptyCart: () => void;
  totalCount: number;
}

// Create a Cart Context
const CartContext = createContext<CartContextType | undefined>(undefined);

// Create a provider component
export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItems>({});

  const totalCount = Object.values(cartItems).reduce((sum, qty) => sum + qty, 0);

  const SetQuantityCart = (itemKey: string, delta: number) => {
    setCartItems((prevItems) => {
      const current = prevItems[itemKey] || 0;
      const newQty = Math.max(current + delta, 0);
      if (newQty > MAX_QUANTITY) {
        Toast.show(`Tối đa ${MAX_QUANTITY} cho mỗi sản phẩm`, { duration: Toast.durations.SHORT });
        return prevItems;
      }
      return { ...prevItems, [itemKey]: newQty };
    });
  };
  

  const addToCart = (itemKey: string, quantity: number) => {
    setCartItems((prevItems) => {
      const current = prevItems[itemKey] || 0;
      const newQty = current + quantity;
      if (newQty > MAX_QUANTITY) {
        Toast.show(`Tối đa ${MAX_QUANTITY} cho mỗi sản phẩm`, { duration: Toast.durations.SHORT });
        return { ...prevItems, [itemKey]: MAX_QUANTITY };
      }
      return { ...prevItems, [itemKey]: newQty };
    });
  };

  
  const emptyCart = () => {
    setCartItems({});
};

  return (
    <CartContext.Provider value={{ cartItems, addToCart, emptyCart, SetQuantityCart, totalCount }}>
      {children}
    </CartContext.Provider>
  );
};

// Custom hook for using cart context
export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};