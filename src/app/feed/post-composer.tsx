"use client";
import { useRef, useTransition } from "react";
import { createPost } from "@/lib/actions/post.actions";

export default function PostComposer() {
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLFormElement>(null);

  function action(formData: FormData) {
    if (!formData.get("body")?.toString().trim()) return;
    startTransition(async () => {
      await createPost(formData);
      ref.current?.reset();
    });
  }

  return (
    <form ref={ref} action={action} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4">
      <textarea name="body" required placeholder="What's happening on the court? 🎾"
        rows={3} maxLength={1000}
        className="w-full resize-none text-sm border-0 outline-none bg-transparent placeholder-gray-400 dark:text-gray-200" />
      <div className="flex justify-end mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
        <button type="submit" disabled={isPending}
          className="bg-green-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors">
          {isPending ? "Posting..." : "Post"}
        </button>
      </div>
    </form>
  );
}
