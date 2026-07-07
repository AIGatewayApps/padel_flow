"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCart } from "./add-to-cart-button";

export default function CartCheckout() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const update = () => setCount(getCart().reduce((s, i) => s + i.qty, 0));
    update();
    window.addEventListener("cart-updated", update);
    return () => window.removeEventListener("cart-updated", update);
  }, []);

  async function checkout() {
    const cart = getCart();
    if (!cart.length) return;
    setLoading(true);
    const res = await fetch("/api/shop/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: cart }),
    });
    if (res.ok) { const { checkoutUrl } = await res.json(); router.push(checkoutUrl); }
    else setLoading(false);
  }

  if (count === 0) return null;

  return (
    <button onClick={checkout} disabled={loading}
      className="flex items-center gap-2 bg-green-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50">
      <span>🛒</span> Cart ({count}) {loading ? "..." : "· Checkout"}
    </button>
  );
}
