"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { completeOnboarding } from "@/lib/actions/onboarding.actions";

type Field = { name: string; label: string; type: string; placeholder?: string; options?: string[]; labels?: string[] };
type Step = { id: string; title: (n: string) => string; subtitle: string; fields: Field[] | null };

const PLAYER_STEPS: Step[] = [
  { id: "welcome", title: (n) => `Welcome, ${n}!`, subtitle: "Let us set up your PadelFlow profile in 3 quick steps.", fields: null },
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
    subtitle: "We will show you nearby courts and players.",
    fields: [
      { name: "city", label: "City", type: "text", placeholder: "e.g. Madrid" },
      { name: "country", label: "Country", type: "text", placeholder: "e.g. Spain" },
    ],
  },
  { id: "done", title: () => "You are all set!", subtitle: "Your profile is ready. Start exploring PadelFlow.", fields: null },
];

const COACH_STEPS: Step[] = [
  { id: "welcome", title: (n) => `Welcome Coach ${n}!`, subtitle: "Set up your coaching profile.", fields: null },
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
  { id: "done", title: () => "Coach profile live!", subtitle: "Players can now find and book you.", fields: null },
];

const COURT_MANAGER_STEPS: Step[] = [
  { id: "welcome", title: (n) => `Welcome, ${n}!`, subtitle: "Set up your court management business on PadelFlow.", fields: null },
  {
    id: "company",
    title: () => "Company details",
    subtitle: "Tell players who manages their courts.",
    fields: [
      { name: "companyName", label: "Company name", type: "text", placeholder: "e.g. PadelPro Courts Ltd" },
      { name: "taxId", label: "Tax ID (optional)", type: "text", placeholder: "VAT or EIN" },
    ],
  },
  {
    id: "first-court",
    title: () => "Add your first court",
    subtitle: "You can add more courts later from your portal.",
    fields: [
      { name: "courtName", label: "Court name", type: "text", placeholder: "e.g. Court 1 - Crystal" },
      { name: "address", label: "Address", type: "text", placeholder: "Street address" },
      { name: "city", label: "City", type: "text", placeholder: "e.g. Madrid" },
      { name: "country", label: "Country", type: "text", placeholder: "e.g. Spain" },
      { name: "pricePerHour", label: "Price per hour ($)", type: "number", placeholder: "25" },
      { name: "surface", label: "Surface", type: "select", options: ["", "crystal", "artificial_grass", "concrete"], labels: ["Select...", "Crystal", "Artificial Grass", "Concrete"] },
    ],
  },
  { id: "done", title: () => "Courts are live!", subtitle: "Players can now find and book your courts.", fields: null },
];

const EVENT_MANAGER_STEPS: Step[] = [
  { id: "welcome", title: (n) => `Welcome, ${n}!`, subtitle: "Set up your event management business on PadelFlow.", fields: null },
  {
    id: "company",
    title: () => "Company details",
    subtitle: "Tell players who organises their events.",
    fields: [
      { name: "companyName", label: "Company name", type: "text", placeholder: "e.g. PadelEvents Ltd" },
      { name: "taxId", label: "Tax ID (optional)", type: "text", placeholder: "VAT or EIN" },
    ],
  },
  {
    id: "first-event",
    title: () => "Create your first event",
    subtitle: "You can add more events later from your portal.",
    fields: [
      { name: "eventTitle", label: "Event title", type: "text", placeholder: "e.g. Madrid Padel Open" },
      { name: "location", label: "Location", type: "text", placeholder: "Venue name / address" },
      { name: "ticketPrice", label: "Ticket price ($)", type: "number", placeholder: "0 for free" },
    ],
  },
  { id: "done", title: () => "Events are live!", subtitle: "Players can now find and book your events.", fields: null },
];

const STEPS_BY_ROLE: Record<string, Step[]> = {
  PLAYER: PLAYER_STEPS,
  COACH: COACH_STEPS,
  COURT_MANAGER: COURT_MANAGER_STEPS,
  EVENT_MANAGER: EVENT_MANAGER_STEPS,
};

export default function OnboardingFlow({ role, displayName }: { role: string; displayName: string }) {
  const steps = STEPS_BY_ROLE[role] ?? PLAYER_STEPS;
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
              Continue
            </button>
          </form>
        ) : (
          <div className="flex flex-col gap-4">
            {isLast && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-4 text-sm text-green-700 dark:text-green-300 text-center">
                Ready to play? Your dashboard is waiting.
              </div>
            )}
            <button onClick={() => handleNext()} disabled={isPending}
              className="bg-green-600 text-white rounded-xl py-3 font-semibold hover:bg-green-700 transition-colors disabled:opacity-50">
              {isPending ? "Setting up..." : isLast ? "Go to dashboard" : "Let us go"}
            </button>
          </div>
        )}

        {!isFirst && !isLast && (
          <button onClick={() => setStep(s => s - 1)} className="mt-3 w-full text-sm text-gray-400 hover:text-gray-600">Back</button>
        )}
      </div>
    </div>
  );
}
