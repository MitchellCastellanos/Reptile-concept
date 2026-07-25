// Simplified renderings of the Klarna mark used to promote this upcoming
// payment option across the storefront (see checkout/actions.ts — it isn't
// wired to a real processor yet).
export function KlarnaMark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex h-4 w-4 items-center justify-center rounded bg-[#FFB3C7] text-[10px] font-black leading-none text-black ${className}`}
    >
      K
    </span>
  );
}

export function KlarnaWordmark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-md bg-[#FFB3C7] px-2 py-1 text-[11px] font-bold leading-none tracking-tight text-black ${className}`}
    >
      Klarna.
    </span>
  );
}

// Simplified renderings of accepted card network marks, shown in the footer
// so customers know which cards work at checkout.
export function VisaMark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex h-6 w-9 items-center justify-center rounded bg-white text-[13px] font-black italic leading-none text-[#1A1F71] ${className}`}
    >
      VISA
    </span>
  );
}

export function MastercardMark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex h-6 w-9 items-center justify-center rounded bg-white ${className}`}>
      <span className="relative flex h-3.5 w-6 items-center justify-center">
        <span className="absolute left-0 h-3.5 w-3.5 rounded-full bg-[#EB001B]" />
        <span className="absolute right-0 h-3.5 w-3.5 rounded-full bg-[#F79E1B] mix-blend-multiply" />
      </span>
    </span>
  );
}

export function AmexMark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex h-6 w-9 items-center justify-center rounded bg-[#2E77BC] text-[9px] font-bold leading-none text-white ${className}`}
    >
      AMEX
    </span>
  );
}
