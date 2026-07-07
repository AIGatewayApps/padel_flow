"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { inviteStaff, removeStaff, updateStaffPermissions } from "./staff.actions";

const ALL_PERMISSIONS = [
  { key: "courts.manage", label: "Manage courts" },
  { key: "courts.view_bookings", label: "View bookings" },
  { key: "slots.manage", label: "Manage slots" },
  { key: "bookings.refund", label: "Refund bookings" },
  { key: "events.manage", label: "Manage events" },
  { key: "tickets.scan", label: "Scan tickets" },
  { key: "reports.view", label: "View reports" },
  { key: "staff.manage", label: "Manage staff" },
  { key: "ads.manage", label: "Manage ads" },
];

type Member = {
  id: string;
  role: string;
  permissions: Record<string, boolean>;
  locationIds: string[];
  user: { id: string; displayName: string; email: string; avatarUrl: string | null };
};

type Location = { id: string; name: string };

export default function StaffManager({
  org, currentUserId,
}: {
  org: { id: string; slug: string; ownerId: string; members: Member[]; locations: Location[] };
  currentUserId: string;
}) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("STAFF");
  const [editing, setEditing] = useState<string | null>(null);
  const [editPerms, setEditPerms] = useState<Record<string, boolean>>({});
  const [editLocations, setEditLocations] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    fd.set("orgId", org.id);
    fd.set("email", inviteEmail);
    fd.set("role", inviteRole);
    startTransition(async () => {
      await inviteStaff(fd);
      toast.success("Invitation sent");
      setInviteEmail("");
    });
  }

  function startEdit(m: Member) {
    setEditing(m.id);
    setEditPerms(m.permissions ?? {});
    setEditLocations(m.locationIds ?? []);
  }

  function saveEdit(memberId: string) {
    const fd = new FormData();
    fd.set("memberId", memberId);
    fd.set("permissions", JSON.stringify(editPerms));
    fd.set("locationIds", JSON.stringify(editLocations));
    startTransition(async () => {
      await updateStaffPermissions(fd);
      toast.success("Permissions updated");
      setEditing(null);
    });
  }

  function handleRemove(memberId: string) {
    if (!confirm("Remove this team member?")) return;
    const fd = new FormData();
    fd.set("memberId", memberId);
    startTransition(async () => {
      await removeStaff(fd);
      toast.success("Member removed");
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Invite form */}
      <form onSubmit={handleInvite} className="border rounded-2xl p-5 flex flex-col sm:flex-row gap-3">
        <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
          placeholder="Email address" type="email" required
          className="flex-1 border rounded-xl px-4 py-2 text-sm" />
        <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
          className="border rounded-xl px-3 py-2 text-sm">
          <option value="MANAGER">Manager</option>
          <option value="STAFF">Staff</option>
          <option value="VIEWER">Viewer</option>
        </select>
        <button type="submit" disabled={isPending}
          className="bg-green-600 text-white rounded-xl px-5 py-2 text-sm font-medium hover:bg-green-700 disabled:opacity-50">
          Invite
        </button>
      </form>

      {/* Member list */}
      <div className="flex flex-col gap-3">
        {org.members.map(m => (
          <div key={m.id} className="border rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              {m.user.avatarUrl
                ? <img src={m.user.avatarUrl} className="w-10 h-10 rounded-full" alt="" />
                : <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold">{m.user.displayName[0]}</div>}
              <div className="flex-1">
                <p className="font-medium text-sm">{m.user.displayName}</p>
                <p className="text-xs text-gray-400">{m.user.email} · {m.role}</p>
              </div>
              {m.user.id !== org.ownerId && m.user.id !== currentUserId && (
                <div className="flex gap-2">
                  <button onClick={() => editing === m.id ? saveEdit(m.id) : startEdit(m)}
                    className="text-xs border rounded-lg px-3 py-1 hover:border-green-400">
                    {editing === m.id ? "Save" : "Edit"}
                  </button>
                  <button onClick={() => handleRemove(m.id)}
                    className="text-xs border border-red-200 text-red-500 rounded-lg px-3 py-1 hover:border-red-400">
                    Remove
                  </button>
                </div>
              )}
            </div>

            {editing === m.id && (
              <div className="mt-3 flex flex-col gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Permissions</p>
                  <div className="grid grid-cols-2 gap-2">
                    {ALL_PERMISSIONS.map(p => (
                      <label key={p.key} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={!!editPerms[p.key]}
                          onChange={e => setEditPerms(prev => ({ ...prev, [p.key]: e.target.checked }))} />
                        {p.label}
                      </label>
                    ))}
                  </div>
                </div>
                {org.locations.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Location access (empty = all)</p>
                    <div className="flex flex-wrap gap-2">
                      {org.locations.map(l => (
                        <label key={l.id} className="flex items-center gap-1 text-sm">
                          <input type="checkbox" checked={editLocations.includes(l.id)}
                            onChange={e => setEditLocations(prev =>
                              e.target.checked ? [...prev, l.id] : prev.filter(id => id !== l.id)
                            )} />
                          {l.name}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
