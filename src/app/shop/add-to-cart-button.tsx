"use client";
import { useState } from "react";

// ponytail: cart stored in localStorage — upgrade to server-side cart when needed
type CartItem = { productId: string; name: string; price: number; qty: number };

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem("pf_cart") ?? "[]"); } catch { return []; }
}

export function saveCart(cart: CartItem[]) {
  localStorage.setItem("pf_cart", JSON.stringify(cart));
  window.dispatchEvent(new Event("cart-updated"));
}

export default function AddToCartButton({ productId, name, price, inStock }: { productId: string; name: string; price: number; inStock: boolean }) {
  const [added, setAdded] = useState(false);

  function add() {
    const cart = getCart();
    const idx = cart.findIndex(i => i.productId === productId);
    if (idx >= 0) cart[idx].qty += 1;
    else cart.push({ productId, name, price, qty: 1 });
    saveCart(cart);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <button onClick={add} disabled={!inStock}
      className="w-full bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition">
      {!inStock ? "Out of stock" : added ? "Added ✓" : "Add to cart"}
    </button>
  );
}
