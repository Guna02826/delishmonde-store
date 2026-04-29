import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getCart } from "../api/cartApi";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const refreshCartCount = useCallback(async () => {
    if (!user) {
      setCartCount(0);
      return;
    }
    
    try {
      const cart = await getCart();
      const count = cart.items.reduce((total, item) => total + item.quantity, 0);
      setCartCount(count);
    } catch (error) {
      console.error("Failed to fetch cart count:", error);
      // Don't reset to 0 on error if we already have a count, 
      // unless it's an auth error handled by AuthContext
    }
  }, [user]);

  useEffect(() => {
    refreshCartCount();
  }, [refreshCartCount]);

  return (
    <CartContext.Provider value={{ cartCount, refreshCartCount, loading }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
