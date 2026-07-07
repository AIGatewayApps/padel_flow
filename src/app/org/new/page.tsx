"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createOrg } from "./org.actions";

export default function NewOrgPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createOrg(fd);
      if (result?.slug) {
        toast.success("Organization created!");
        router.push(`/org/${result.slug}`);
      }
    });
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold mb-2">Create organization</h1>
      <p className="text-gray-500 text-sm mb-8">Set up your team, locations, courts and events under one roof.</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-sm font-medium block mb-1">Organization name</label>
          <input name="name" required placeholder="e.g. Madrid Padel Club"
            className="w-full border rounded-xl px-4 py-2 text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">URL slug</label>
          <input name="slug" required placeholder="madrid-padel-club"
            pattern="[a-z0-9\-]+" title="Lowercase letters, numbers and hyphens only"
            className="w-full border rounded-xl px-4 py-2 text-sm" />
          <p className="text-xs text-gray-400 mt-1">padelflow.com/org/<strong>your-slug</strong></p>
        </div>
        <button type="submit" disabled={isPending}
          className="bg-green-600 text-white rounded-xl px-5 py-3 font-medium hover:bg-green-700 disabled:opacity-50">
          {isPending ? "Creating..." : "Create organization"}
        </button>
      </form>
    </main>
  );
}
