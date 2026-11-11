import { useId } from "react";
import "./epc-scanner.css";

export function EpcScanner({ reading }: { reading: boolean }) {
  const gradientId = useId();

  return (
    <div className="epc-scanner relative mx-auto flex aspect-square w-56 items-center justify-center" data-reading={reading} aria-hidden="true">
      <div className="epc-scanner-grid absolute inset-0 rounded-2xl" />
      <svg viewBox="0 0 240 240" fill="none" className="relative size-full">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="currentColor" stopOpacity="0" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0.16" />
          </linearGradient>
        </defs>
        <path d="M22 64V22h42M176 22h42v42M218 176v42h-42M64 218H22v-42" stroke="currentColor" strokeWidth="3" className="text-foreground/70" />
        <g className="epc-scanner-waves text-emerald-500" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path className="epc-wave epc-wave-one" d="M65 88a48 48 0 0 0 0 64M175 88a48 48 0 0 1 0 64" />
          <path className="epc-wave epc-wave-two" d="M52 75a66 66 0 0 0 0 90M188 75a66 66 0 0 1 0 90" />
          <path className="epc-wave epc-wave-three" d="M39 62a84 84 0 0 0 0 116M201 62a84 84 0 0 1 0 116" />
        </g>
        <g className="epc-scanner-chip" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <rect x="80" y="80" width="80" height="80" rx="13" className="fill-background" />
          <rect x="98" y="98" width="44" height="44" rx="5" strokeWidth="2" className="fill-muted" />
          <path d="M96 68v12m16-12v12m16-12v12m16-12v12M96 160v12m16-12v12m16-12v12m16-12v12M68 96h12m-12 16h12m-12 16h12m-12 16h12M160 96h12m-12 16h12m-12 16h12m-12 16h12" />
          <path d="M111 129v-18m0 9h18m0-9v18" strokeWidth="2" />
        </g>
        <circle cx="153" cy="87" r="3" className="epc-scanner-led" fill="currentColor" />
        <g className="epc-scanner-beam text-emerald-500">
          <rect x="30" y="-27" width="180" height="28" fill={`url(#${gradientId})`} />
          <path d="M30 0h180" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <circle cx="30" r="3" fill="currentColor" />
          <circle cx="210" r="3" fill="currentColor" />
        </g>
      </svg>
    </div>
  );
}
