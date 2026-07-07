"use client";
import { useClerk } from "@clerk/nextjs";

export default function ClerkProButton() {
  const { openBilling } = useClerk();

  function handleSubscribe() {
    if (openBilling) {
      openBilling();
    } else {
      window.location.href = "/dashboard#billing";
    }
  }

  return (
    <button onClick={handleSubscribe}
      className="block mt-6 mx-auto bg-green-600 text-white rounded-xl py-3 px-8 font-semibold hover:bg-green-700 transition-colors">
      Upgrade to Pro
    </button>
  );
}
