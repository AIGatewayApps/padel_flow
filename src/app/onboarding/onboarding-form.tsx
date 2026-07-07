"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("PLAYER");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: fd.get("username"),
        displayName: fd.get("displayName"),
        role: fd.get("role"),
        city: fd.get("city"),
        country: fd.get("country"),
        // role-specific
        companyName: fd.get("companyName"),
      }),
    });
    if (res.ok) router.push("/dashboard");
    else setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input name="username" required placeholder="Username" minLength={3} maxLength={30}
        className="border rounded-lg px-4 py-2 w-full" />
      <input name="displayName" required placeholder="Display name"
        className="border rounded-lg px-4 py-2 w-full" />
      <select name="role" value={role} onChange={e => setRole(e.target.value)}
        className="border rounded-lg px-4 py-2 w-full">
        <option value="PLAYER">Player</option>
        <option value="COURT_MANAGER">Court Management</option>
        <option value="EVENT_MANAGER">Event / Media Management</option>
      </select>
      {(role === "COURT_MANAGER" || role === "EVENT_MANAGER") && (
        <input name="companyName" required placeholder="Company / Organization name"
          className="border rounded-lg px-4 py-2 w-full" />
      )}
      <input name="city" placeholder="City" className="border rounded-lg px-4 py-2 w-full" />
      <input name="country" placeholder="Country" className="border rounded-lg px-4 py-2 w-full" />
      <button type="submit" disabled={loading}
        className="bg-green-600 text-white rounded-lg px-4 py-3 font-semibold hover:bg-green-700 disabled:opacity-50">
        {loading ? "Creating account..." : "Create my account"}
      </button>
    </form>
  );
}
