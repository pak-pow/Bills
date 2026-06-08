"use client";

import { Tab } from "../app/page";
import { Zap, LayoutDashboard, Settings, Globe } from "lucide-react";

interface NavbarProps {
  walletAddress: string | null;
  network: string | null;
  onConnect: () => void;
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  currency: string;
  setCurrency: (currency: string) => void;
}

export default function Navbar({
  walletAddress,
  network,
  onConnect,
  activeTab,
  setActiveTab,
  currency,
  setCurrency,
}: NavbarProps) {
  return (
    <nav className="border-b" style={{ background: "var(--navy-900)", borderColor: "var(--surface-border)" }}>
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold tracking-tight font-display flex items-center gap-1.5">
            <Zap className="h-6 w-6 text-gold fill-gold" />
            Palo! <span style={{ color: "var(--gold-400)" }}>Bills</span>
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider stat-gradient border" style={{ borderColor: "rgba(251,191,36,0.15)", color: "var(--gold-400)" }}>
            Co-Living Split
          </span>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-4">
          {walletAddress && (
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "dashboard" ? "text-gold" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                House Dashboard
              </button>
              <button
                onClick={() => setActiveTab("admin")}
                className={`text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "admin" ? "text-gold" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                <Settings className="h-4 w-4" />
                Manager Portal
              </button>
            </div>
          )}

          {/* Currency Selector */}
          <div className="flex items-center gap-1.5 bg-navy-800 border rounded-lg px-2.5 py-1 text-xs text-text-primary font-semibold" style={{ borderColor: "var(--surface-border)" }}>
            <span className="text-[10px] text-text-secondary uppercase">Asset:</span>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="bg-transparent text-gold font-bold focus:outline-none cursor-pointer pr-1"
              style={{ border: "none", outline: "none" }}
            >
              <option value="USDC" className="bg-navy-900 text-text-primary font-bold">USDC</option>
              <option value="PHP" className="bg-navy-900 text-text-primary font-bold">PHP</option>
              <option value="XLM" className="bg-navy-900 text-text-primary font-bold">XLM</option>
            </select>
          </div>

          {/* Network Badge */}
          {network && (
            <span className="badge-green flex items-center gap-1">
              <Globe className="h-3 w-3 animate-pulse" />
              {network}
            </span>
          )}

          {/* Connect Button */}
          <button
            onClick={onConnect}
            className={walletAddress ? "btn-outline py-2 px-4 text-xs font-bold" : "btn-primary py-2 px-4 text-xs font-bold"}
            style={{ borderRadius: "0.5rem" }}
          >
            {walletAddress
              ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`
              : "Connect Wallet"}
          </button>
        </div>
      </div>
    </nav>
  );
}
