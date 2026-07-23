// Simplified renderings of the Stripe and Klarna marks used to promote these
// upcoming payment options across the storefront (see checkout/actions.ts —
// neither is wired to a real processor yet).
export function StripeMark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-md bg-[#635BFF] px-2 py-1 text-[11px] font-bold italic leading-none text-white ${className}`}
    >
      stripe
    </span>
  );
}

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
