"use client";

import { Zap, Lock, Percent, CheckCircle } from "lucide-react";

interface HeroSectionProps {
  onConnect: () => void;
}

export default function HeroSection({ onConnect }: HeroSectionProps) {
  return (
    <div className="max-w-4xl mx-auto px-6 py-20 text-center flex flex-col items-center gap-8">
      {/* Badge */}
      <span className="text-xs px-3.5 py-1 rounded-full font-bold uppercase tracking-wider stat-gradient border text-gold flex items-center gap-1.5" style={{ borderColor: "rgba(251,191,36,0.25)" }}>
        <Zap className="h-3.5 w-3.5 fill-gold text-gold" />
        Trustless Roommate Split Billing
      </span>

      {/* Main heading */}
      <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight font-display max-w-2xl leading-tight text-text-primary">
        Co-Living Shared Bill Splits, <span style={{ color: "var(--gold-400)" }}>Simplified</span>
      </h1>

      {/* Description */}
      <p className="text-lg text-text-secondary max-w-2xl leading-relaxed">
        Automate roommate split calculations on-chain. Pre-fund the household pool in USDC, PHP, or XLM, split utilities or rent automatically, and settle splits programmatically via Soroban smart contracts with zero payment friction.
      </p>

      {/* Connect Action */}
      <div className="flex flex-col items-center gap-4 mt-4">
        <button
          onClick={onConnect}
          className="btn-primary py-4 px-8 text-sm font-bold tracking-wide shadow-lg cursor-pointer"
          style={{ borderRadius: "0.75rem" }}
        >
          Connect Freighter Wallet
        </button>
        <p className="text-xs text-text-muted">
          Freighter extension required. Ensure network is set to **Test Net**.
        </p>
      </div>

      {/* Core Features list */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 w-full text-left">
        <div className="card p-6">
          <div className="text-gold mb-3">
            <Lock className="h-8 w-8" />
          </div>
          <h4 className="text-lg font-bold font-display mb-2 text-text-primary">On-Chain Custody</h4>
          <p className="text-sm text-text-secondary">
            Funds are secured inside a Soroban smart contract. Roommates pre-fund their bills directly into the shared pool.
          </p>
        </div>

        <div className="card p-6">
          <div className="text-gold mb-3">
            <Percent className="h-8 w-8" />
          </div>
          <h4 className="text-lg font-bold font-display mb-2 text-text-primary">Weighted Splits</h4>
          <p className="text-sm text-text-secondary">
            Define custom split percentages based on room size, usage, or occupancy, and lock them in persistent contract state.
          </p>
        </div>

        <div className="card p-6">
          <div className="text-gold mb-3">
            <CheckCircle className="h-8 w-8" />
          </div>
          <h4 className="text-lg font-bold font-display mb-2 text-text-primary">One-Click Settlement</h4>
          <p className="text-sm text-text-secondary">
            Admin broadcasts a bill and splits are instantly calculated, charged, and deducted from roommate balances.
          </p>
        </div>
      </div>
    </div>
  );
}
