"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { completeOnboarding } from "@/lib/actions/onboarding.actions";

const PLAYER_STEPS = [
  {
    id: "welcome",
    title: (name: string) => `Welcome, ${name}! 🎾`,
    subtitle: "Let's set up your PadelFlow profile in 3 quick steps.",
    fields: null,
  },
  {
    id: "profile",
    title: () => "Your playing style",
    subtitle: "Help us personalise your experience.",
    fields: [
      { name: "racket", label: "Favourite racket brand", type: "text", placeholder: "e.g. Bullpadel" },
      { name: "hand", label: "Playing hand", type: "select", options: ["", "RIGHT", "LEFT"], labels: ["Select...", "Right", "Left"] },
      { name: "position", label: "Preferred position", type: "select", options: ["", "DRIVE", "REVES"], labels: ["Select...", "Drive (right)", "Reves (left)"] },
    ],
  },
  {
    id: "location",
    title: () => "Where do you play?",
    subtitle: "We'll show you nearby courts and players.",
    fields: [
      { name: "city", label: "City", type: "text", placeholder: "e.g. Madrid" },
      { name: "country", label: "Country", type: "text", placeholder: "e.g. Spain" },
    ],
  },
  {
    id: "done",
    title: () => "You're all set! 🎉",
    subtitle: "Your profile is ready. Start exploring PadelFlow.",
    fields: null,
  },
];

const COACH_STEPS = [
  { id: "welcome", title: (name: string) => `Welcome Coach ${name}! 🎾`, subtitle: "Set up your coaching profile.", fields: null },
  {
    id: "coach-profile",
    title: () => "Your coaching details",
    subtitle: "This is shown to players browsing for coaches.",
    fields: [
      { name: "bio", label: "Bio", type: "textarea", placeholder: "Tell players about your background..." },
      { name: "pricePerHour", label: "Price per hour ($)", type: "number", placeholder: "50" },
      { name: "certifications", label: "Certifications", type: "text", placeholder: "e.g. WPT Level 2" },
    ],
  },
  { id: "done", title: () => "Coach profile live! 🎉", subtitle: "Players can now find and book you.", fields: null },
];

export default function OnboardingFlow({ role, displayName }: { role: string; displayName: string }) {
  const steps = role === "COACH" ? COACH_STEPS : PLAYER_STEPS;
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const current = steps[step];
  const isLast = step === steps.length - 1;
  const isFirst = step === 0;

  function handleNext(e?: React.FormEvent) {
    e?.preventDefault();
    if (isLast) {
      startTransition(async () => {
        await completeOnboarding(data, role);
        router.push("/dashboard");
      });
    } else {
      setStep(s => s + 1);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-950 dark:to-gray-900 px-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl w-full max-w-md p-8">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s.id} className={`h-2 rounded-full transition-all duration-300 ${
              i === step ? "w-8 bg-green-600" : i < step ? "w-2 bg-green-400" : "w-2 bg-gray-200"
            }`} />
          ))}
        </div>

        <h1 className="text-2xl font-bold mb-2">{current.title(displayName)}</h1>
        <p className="text-gray-500 text-sm mb-8">{current.subtitle}</p>

        {current.fields ? (
          <form onSubmit={handleNext} className="flex flex-col gap-4">
            {current.fields.map(field => (
              <div key={field.name} className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{field.label}</label>
                {field.type === "textarea" ? (
                  <textarea name={field.name} placeholder={field.placeholder} rows={4}
                    value={data[field.name] ?? ""} onChange={e => setData(d => ({ ...d, [field.name]: e.target.value }))}
                    className="border rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500" />
                ) : field.type === "select" ? (
                  <select name={field.name} value={data[field.name] ?? ""}
                    onChange={e => setData(d => ({ ...d, [field.name]: e.target.value }))}
                    className="border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                    {field.options!.map((opt, i) => <option key={opt} value={opt}>{field.labels![i]}</option>)}
                  </select>
                ) : (
                  <input type={field.type} name={field.name} placeholder={field.placeholder}
                    value={data[field.name] ?? ""} onChange={e => setData(d => ({ ...d, [field.name]: e.target.value }))}
                    className="border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                )}
              </div>
            ))}
            <button type="submit" className="mt-2 bg-green-600 text-white rounded-xl py-3 font-semibold hover:bg-green-700 transition-colors">
              Continue →
            </button>
          </form>
        ) : (
          <div className="flex flex-col gap-4">
            {isLast && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-4 text-sm text-green-700 dark:text-green-300 text-center">
                🎾 Ready to play? Your dashboard is waiting.
              </div>
            )}
            <button onClick={() => handleNext()} disabled={isPending}
              className="bg-green-600 text-white rounded-xl py-3 font-semibold hover:bg-green-700 transition-colors disabled:opacity-50">
              {isPending ? "Setting up..." : isLast ? "Go to dashboard" : "Let's go →"}
            </button>
          </div>
        )}

        {!isFirst && !isLast && (
          <button onClick={() => setStep(s => s - 1)} className="mt-3 w-full text-sm text-gray-400 hover:text-gray-600">← Back</button>
        )}
      </div>
    </div>
  );
}
