"use client";
import { useState } from "react";
import type { User, UserSettings } from "@prisma/client";

type Props = { user: User; settings: UserSettings | null };

function Toggle({ label, name, defaultChecked }: { label: string; name: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center justify-between py-3 border-b last:border-0">
      <span>{label}</span>
      <input type="checkbox" name={name} defaultChecked={defaultChecked}
        className="w-5 h-5 accent-green-600" />
    </label>
  );
}

export default function SettingsForm({ user, settings }: Props) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("saving");
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(
      ["emailBookings","emailMessages","emailMarketing","pushBookings","pushMessages",
       "pushFriendRequests","profilePublic","showLevel","showLocation","allowFriendRequests"]
      .map(k => [k, fd.has(k)])
      .concat([["language", fd.get("language") as string],["timezone", fd.get("timezone") as string],["theme", fd.get("theme") as string]])
    );
    await fetch("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setStatus("saved");
    setTimeout(() => setStatus("idle"), 2000);
  }

  const s = settings;
  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <section>
        <h2 className="text-lg font-semibold mb-2">Profile</h2>
        <input name="displayName" defaultValue={user.displayName} placeholder="Display name"
          className="border rounded-lg px-4 py-2 w-full mb-2" />
        <input name="bio" defaultValue={user.bio ?? ""} placeholder="Bio"
          className="border rounded-lg px-4 py-2 w-full mb-2" />
        <input name="city" defaultValue={user.city ?? ""} placeholder="City"
          className="border rounded-lg px-4 py-2 w-full" />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">Email notifications</h2>
        <Toggle label="Bookings" name="emailBookings" defaultChecked={s?.emailBookings} />
        <Toggle label="Messages" name="emailMessages" defaultChecked={s?.emailMessages} />
        <Toggle label="Marketing" name="emailMarketing" defaultChecked={s?.emailMarketing} />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">Push notifications</h2>
        <Toggle label="Bookings" name="pushBookings" defaultChecked={s?.pushBookings} />
        <Toggle label="Messages" name="pushMessages" defaultChecked={s?.pushMessages} />
        <Toggle label="Friend requests" name="pushFriendRequests" defaultChecked={s?.pushFriendRequests} />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">Privacy</h2>
        <Toggle label="Public profile" name="profilePublic" defaultChecked={s?.profilePublic} />
        <Toggle label="Show skill level" name="showLevel" defaultChecked={s?.showLevel} />
        <Toggle label="Show location" name="showLocation" defaultChecked={s?.showLocation} />
        <Toggle label="Allow friend requests" name="allowFriendRequests" defaultChecked={s?.allowFriendRequests} />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">Preferences</h2>
        <select name="theme" defaultValue={s?.theme ?? "system"}
          className="border rounded-lg px-4 py-2 w-full mb-2">
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
        <input name="timezone" defaultValue={s?.timezone ?? "UTC"} placeholder="Timezone (e.g. America/Mexico_City)"
          className="border rounded-lg px-4 py-2 w-full" />
      </section>

      <button type="submit" disabled={status === "saving"}
        className="bg-green-600 text-white rounded-lg px-4 py-3 font-semibold hover:bg-green-700 disabled:opacity-50">
        {status === "saving" ? "Saving..." : status === "saved" ? "Saved ✓" : "Save settings"}
      </button>
    </form>
  );
}
