"use client";
import { useState, useTransition } from "react";
import { upsertAvailability } from "@/lib/actions/coach.actions";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Slot = { id: string; dayOfWeek: number; startHour: number; endHour: number };

export default function AvailabilityEditor({ coachId, availability }: { coachId: string; availability: Slot[] }) {
  const [slots, setSlots] = useState<Slot[]>(availability);
  const [isPending, startTransition] = useTransition();

  function toggle(day: number) {
    const existing = slots.find(s => s.dayOfWeek === day);
    if (existing) setSlots(s => s.filter(x => x.dayOfWeek !== day));
    else setSlots(s => [...s, { id: `new-${day}`, dayOfWeek: day, startHour: 9, endHour: 18 }]);
  }

  function updateHour(day: number, field: "startHour" | "endHour", val: number) {
    setSlots(s => s.map(x => x.dayOfWeek === day ? { ...x, [field]: val } : x));
  }

  function save() {
    startTransition(async () => {
      await upsertAvailability(coachId, slots.map(s => ({ dayOfWeek: s.dayOfWeek, startHour: s.startHour, endHour: s.endHour })));
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-7 gap-2">
        {DAYS.map((day, i) => {
          const active = slots.some(s => s.dayOfWeek === i);
          return (
            <button key={day} onClick={() => toggle(i)}
              className={`py-3 rounded-xl text-sm font-medium transition-colors ${
                active ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
              }`}>
              {day}
            </button>
          );
        })}
      </div>
      {slots.sort((a, b) => a.dayOfWeek - b.dayOfWeek).map(slot => (
        <div key={slot.dayOfWeek} className="flex items-center gap-3 bg-green-50 dark:bg-green-900/20 rounded-xl px-4 py-3">
          <span className="font-medium w-8 text-sm">{DAYS[slot.dayOfWeek]}</span>
          <div className="flex items-center gap-2 flex-1">
            <select value={slot.startHour} onChange={e => updateHour(slot.dayOfWeek, "startHour", +e.target.value)}
              className="border rounded-lg px-2 py-1 text-sm">
              {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{h}:00</option>)}
            </select>
            <span className="text-gray-400 text-sm">to</span>
            <select value={slot.endHour} onChange={e => updateHour(slot.dayOfWeek, "endHour", +e.target.value)}
              className="border rounded-lg px-2 py-1 text-sm">
              {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{h}:00</option>)}
            </select>
          </div>
        </div>
      ))}
      <button onClick={save} disabled={isPending}
        className="bg-green-600 text-white rounded-xl py-3 font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors">
        {isPending ? "Saving..." : "Save availability"}
      </button>
    </div>
  );
}
