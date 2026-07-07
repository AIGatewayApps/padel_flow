"use client";
import { useState } from "react";
import { bookCourt } from "@/lib/actions/booking.actions";

type Slot = { id: string; startsAt: string; endsAt: string; available: boolean };

function startOfWeek(d: Date) {
  const c = new Date(d);
  c.setDate(c.getDate() - c.getDay());
  c.setHours(0, 0, 0, 0);
  return c;
}

const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 06:00 – 21:00
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CourtCalendar({ courtId, pricePerHour, slots }: { courtId: string; pricePerHour: number; slots: Slot[] }) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [selected, setSelected] = useState<string | null>(null);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  function getSlot(day: Date, hour: number) {
    return slots.find(s => {
      const st = new Date(s.startsAt);
      return st.getFullYear() === day.getFullYear() &&
        st.getMonth() === day.getMonth() &&
        st.getDate() === day.getDate() &&
        st.getHours() === hour;
    });
  }

  const selectedSlot = slots.find(s => s.id === selected);

  return (
    <div className="flex flex-col gap-6">
      {/* Week nav */}
      <div className="flex items-center justify-between">
        <button onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d); }}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800">←</button>
        <span className="text-sm font-semibold">
          {weekStart.toLocaleDateString("en", { month: "long", day: "numeric" })} –{" "}
          {weekDays[6].toLocaleDateString("en", { month: "long", day: "numeric", year: "numeric" })}
        </span>
        <button onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d); }}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800">→</button>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <div className="grid min-w-[500px]" style={{ gridTemplateColumns: `48px repeat(7, 1fr)` }}>
          {/* Header */}
          <div />
          {weekDays.map((d, i) => (
            <div key={i} className="text-center text-xs font-semibold text-gray-500 pb-2">
              <div>{DAYS[d.getDay()]}</div>
              <div className="text-base font-bold text-gray-800 dark:text-gray-100">{d.getDate()}</div>
            </div>
          ))}
          {/* Hour rows */}
          {HOURS.map(h => (
            <>
              <div key={`h-${h}`} className="text-xs text-gray-400 pt-1 pr-2 text-right">{h}:00</div>
              {weekDays.map((d, di) => {
                const slot = getSlot(d, h);
                const isSelected = slot?.id === selected;
                return (
                  <div key={`${h}-${di}`} className="p-0.5">
                    {slot ? (
                      <button onClick={() => setSelected(isSelected ? null : slot.id)}
                        disabled={!slot.available}
                        className={`w-full h-8 rounded-lg text-xs transition-colors ${
                          !slot.available ? "bg-gray-100 text-gray-400 cursor-not-allowed" :
                          isSelected ? "bg-green-600 text-white" :
                          "bg-green-100 text-green-700 hover:bg-green-200"
                        }`}>
                        {slot.available ? "Open" : "Full"}
                      </button>
                    ) : <div className="w-full h-8" />}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </div>

      {/* Booking panel */}
      {selectedSlot && (
        <div className="border border-green-300 rounded-2xl p-4 bg-green-50 dark:bg-green-900/20">
          <p className="font-semibold text-sm mb-1">
            {new Date(selectedSlot.startsAt).toLocaleString("en", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
          <p className="text-xs text-gray-500 mb-3">
            Duration: {Math.round((new Date(selectedSlot.endsAt).getTime() - new Date(selectedSlot.startsAt).getTime()) / 3600000)}h · ${pricePerHour}/hr
          </p>
          <form action={bookCourt}>
            <input type="hidden" name="courtId" value={courtId} />
            <input type="hidden" name="slotId" value={selectedSlot.id} />
            <button type="submit" className="w-full bg-green-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-green-700">
              Confirm booking
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
