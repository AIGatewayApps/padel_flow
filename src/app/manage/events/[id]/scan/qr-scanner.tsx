"use client";
import { useEffect, useRef, useState } from "react";
import { scanTicket } from "@/lib/actions/ticket.actions";

export default function QrScanner({ eventId }: { eventId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<"idle" | "scanning" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let stream: MediaStream;

    async function start() {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }

      if ("BarcodeDetector" in window) {
        const detector = new (window as unknown as { BarcodeDetector: new (o: object) => { detect: (v: HTMLVideoElement) => Promise<{ rawValue: string }[]> } }).BarcodeDetector({ formats: ["qr_code"] });
        const interval = setInterval(async () => {
          if (!videoRef.current || status === "success") return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes.length > 0) {
              clearInterval(interval);
              const result = await scanTicket(eventId, codes[0].rawValue);
              setStatus("success");
              setMessage(result.name);
              setTimeout(() => setStatus("scanning"), 2500);
            }
          } catch { }
        }, 500);
        setStatus("scanning");
        return () => clearInterval(interval);
      } else {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        const reader = new BrowserMultiFormatReader();
        reader.decodeFromVideoDevice(undefined, videoRef.current!, (result) => {
          if (result) {
            const text = (result as { getText: () => string }).getText();
            scanTicket(eventId, text).then(r => {
              setStatus("success");
              setMessage(r.name);
              setTimeout(() => setStatus("scanning"), 2500);
            }).catch(() => { });
          }
        });
        setStatus("scanning");
        return () => { reader.stopAsyncDecode?.(); };
      }
    }

    start().catch(() => setStatus("error"));
    return () => { stream?.getTracks().forEach(t => t.stop()); };
  }, [eventId, status]);

  return (
    <div className="relative rounded-2xl overflow-hidden bg-black aspect-square">
      <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-48 h-48 border-4 border-white rounded-2xl opacity-60" />
      </div>
      {status === "success" && (
        <div className="absolute inset-0 bg-green-600/90 flex flex-col items-center justify-center gap-2">
          <span className="text-5xl">OK</span>
          <p className="text-white font-bold text-lg">{message}</p>
          <p className="text-green-200 text-sm">Ticket valid</p>
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-600/90">
          <p className="text-white text-sm">Camera access denied or unavailable</p>
        </div>
      )}
    </div>
  );
}
