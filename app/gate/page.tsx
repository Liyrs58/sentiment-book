import { redirect } from "next/navigation";
import { GateForm } from "@/components/gate-form";
import { isAuthRequired } from "@/lib/flags";

export const dynamic = "force-dynamic";

export default function GatePage() {
  if (!isAuthRequired()) redirect("/");

  return (
    <div className="min-h-full bg-[#FAF7F2] text-[#111827]">
      <div className="mx-auto max-w-[640px] px-5 py-16 sm:px-8">
        <h1 className="font-serif text-[2.15rem] leading-[0.95] font-semibold tracking-[-0.02em] uppercase">
          Sentiment Book
        </h1>
        <p className="mt-4 max-w-prose text-[14px] leading-5 text-[#6B7280]">
          This desk is behind an optional access code. Scoring stays lexicon or FinBERT. LIVE_TRADING
          is false.
        </p>
        <GateForm />
      </div>
    </div>
  );
}
