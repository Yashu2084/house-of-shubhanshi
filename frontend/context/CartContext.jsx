'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CART_STORAGE_KEY = 'house_of_shubhanshi_cart';
const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [modalItem, setModalItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Initialize cart from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load cart from storage:', e);
    }
  }, []);

  // Save to localStorage whenever items change
  const persistItems = useCallback((newItems) => {
    setItems(newItems);
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newItems));
    } catch (e) {
      console.error('Failed to save cart to storage:', e);
    }
  }, []);

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  }, []);

  const openModal = useCallback((details) => {
    setModalItem(details);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setTimeout(() => setModalItem(null), 300);
  }, []);

  const addItem = useCallback((product, quantity = 1, rentalOptions = null) => {
    let updated;
    if (rentalOptions) {
      const cartItemId = `${product.id}_rent_${rentalOptions.rentalStartDate}_${rentalOptions.rentalDays}`;
      const existing = items.find(i => i.cartItemId === cartItemId);

      if (existing) {
        showToast(`"${product.name}" rental is already in your curated bag.`);
        return;
      }

      const newItem = {
        cartItemId,
        productId: product.id,
        name: product.name,
        image: product.image,
        category: product.category,
        purchaseType: 'RENT',
        price: rentalOptions.totalRentalCost,
        rentalPrice: rentalOptions.rentalPrice,
        securityDeposit: rentalOptions.securityDeposit,
        rentalDays: rentalOptions.rentalDays,
        rentalStartDate: rentalOptions.rentalStartDate,
        rentalEndDate: rentalOptions.rentalEndDate,
        quantity: 1
      };

      updated = [...items, newItem];
      persistItems(updated);

      openModal({
        name: product.name,
        image: product.image,
        category: product.category,
        isRental: true,
        rentalDays: rentalOptions.rentalDays,
        rentalPrice: rentalOptions.rentalPrice,
        securityDeposit: rentalOptions.securityDeposit,
        price: rentalOptions.totalRentalCost
      });
    } else {
      const cartItemId = `${product.id}_buy`;
      const existingIndex = items.findIndex(
        i => i.cartItemId === cartItemId || (i.productId === product.id && i.purchaseType !== 'RENT')
      );

      if (existingIndex > -1) {
        updated = [...items];
        updated[existingIndex].quantity += quantity;
      } else {
        const newItem = {
          cartItemId,
          productId: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          category: product.category,
          purchaseType: 'BUY',
          quantity
        };
        updated = [...items, newItem];
      }

      persistItems(updated);

      openModal({
        name: product.name,
        image: product.image,
        category: product.category,
        isRental: false,
        price: product.price
      });
    }
  }, [items, persistItems, openModal, showToast]);

  const removeItem = useCallback((cartItemId) => {
    const updated = items.filter(i => (i.cartItemId || i.productId) !== cartItemId);
    persistItems(updated);
  }, [items, persistItems]);

  const updateQuantity = useCallback((cartItemId, delta) => {
    const updated = items.map(item => {
      if ((item.cartItemId || item.productId) === cartItemId) {
        if (item.purchaseType === 'RENT') return item;
        const newQty = (item.quantity || 1) + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean);

    persistItems(updated);
  }, [items, persistItems]);

  const clearCart = useCallback(() => {
    persistItems([]);
  }, [persistItems]);

  const totalCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);

  const garmentsSubtotal = items.reduce((sum, item) => {
    if (item.purchaseType === 'RENT') {
      return sum + (item.rentalPrice || 0);
    }
    return sum + ((item.price || 0) * (item.quantity || 1));
  }, 0);

  const depositsTotal = items.reduce((sum, item) => {
    if (item.purchaseType === 'RENT') {
      return sum + (item.securityDeposit || 0);
    }
    return sum;
  }, 0);

  const grandTotal = garmentsSubtotal + depositsTotal;

  return (
    <CartContext.Provider
      value={{
        items,
        totalCount,
        garmentsSubtotal,
        depositsTotal,
        grandTotal,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        modalItem,
        isModalOpen,
        closeModal,
        toastMessage,
        showToast
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export default CartContext;
