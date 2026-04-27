import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const getCart = async () => {
  const response = await axios.get(`${API_URL}/cart`, {
    withCredentials: true,
  });

  return response.data;
};

export const addCartItem = async (productId, quantity) => {
  const response = await axios.post(
    `${API_URL}/cart/items`,
    { productId, quantity },
    { withCredentials: true }
  );

  return response.data;
};

export const removeCartItem = async (productId) => {
  const response = await axios.delete(`${API_URL}/cart/items/${productId}`, {
    withCredentials: true,
  });

  return response.data;
};

export const updateCartItem = async (productId, quantity) => {
  const response = await axios.put(
    `${API_URL}/cart/items/${productId}`,
    { quantity },
    { withCredentials: true }
  );

  return response.data;
};

export const clearCart = async () => {
  const response = await axios.delete(`${API_URL}/cart`, {
    withCredentials: true,
  });

  return response.data;
};

export const applyCoupon = async (couponCode, items) => {
  const response = await axios.post(
    `${API_URL}/coupons/apply`,
    { couponCode, items },
    { withCredentials: true }
  );

  return response.data;
};
