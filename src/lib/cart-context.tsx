"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type CartLine = {
  type: "animal" | "product";
  id: string;
  name: string;
  priceCAD: number;
  quantity: number;
  maxQuantity?: number;
};

type CartContextValue = {
  items: CartLine[];
  addAnimal: (id: string, name: string, priceCAD: number) => void;
  addProduct: (
    id: string,
    name: string,
    priceCAD: number,
    maxQuantity: number,
  ) => void;
  setProductQuantity: (id: string, quantity: number) => void;
  removeItem: (type: CartLine["type"], id: string) => void;
  clear: () => void;
  totalCAD: number;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "reptile-concept-cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // ignore malformed cart data
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addAnimal = useCallback((id: string, name: string, priceCAD: number) => {
    setItems((prev) => {
      if (prev.some((item) => item.type === "animal" && item.id === id)) return prev;
      return [...prev, { type: "animal", id, name, priceCAD, quantity: 1 }];
    });
  }, []);

  const addProduct = useCallback(
    (id: string, name: string, priceCAD: number, maxQuantity: number) => {
      setItems((prev) => {
        const existing = prev.find((item) => item.type === "product" && item.id === id);
        if (existing) {
          return prev.map((item) =>
            item.type === "product" && item.id === id
              ? { ...item, quantity: Math.min(item.quantity + 1, maxQuantity) }
              : item,
          );
        }
        return [...prev, { type: "product", id, name, priceCAD, quantity: 1, maxQuantity }];
      });
    },
    [],
  );

  const setProductQuantity = useCallback((id: string, quantity: number) => {
    setItems((prev) =>
      prev
        .map((item) =>
          item.type === "product" && item.id === id
            ? { ...item, quantity: Math.max(1, quantity) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }, []);

  const removeItem = useCallback((type: CartLine["type"], id: string) => {
    setItems((prev) => prev.filter((item) => !(item.type === type && item.id === id)));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const totalCAD = useMemo(
    () => items.reduce((sum, item) => sum + item.priceCAD * item.quantity, 0),
    [items],
  );

  const value = useMemo(
    () => ({ items, addAnimal, addProduct, setProductQuantity, removeItem, clear, totalCAD }),
    [items, addAnimal, addProduct, setProductQuantity, removeItem, clear, totalCAD],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
