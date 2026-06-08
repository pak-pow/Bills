"use client";

import { useState } from "react";
import { isConnected, requestAccess, getNetworkDetails } from "@stellar/freighter-api";
import { AlertTriangle } from "lucide-react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import Dashboard from "@/components/Dashboard";
import ManagerPortal from "@/components/ManagerPortal";

export type Tab = "dashboard" | "admin";

export default function Home() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [connectError, setConnectError] = useState<string | null>(null);

  const handleConnect = async () => {
    if (walletAddress) {
      setWalletAddress(null);
      setNetwork(null);
      return;
    }

    setConnectError(null);

    try {
      // Check if Freighter is installed
      const connected = await isConnected();
      console.log("Freighter isConnected result:", connected);
      
      // Handle both boolean and object return types defensively
      const isInstalled = 
        connected === true || 
        (connected && typeof connected === "object" && (connected.isConnected === true || (connected as any).isConnected === true));

      if (!isInstalled) {
        setConnectError("Freighter is not installed. Please install it from freighter.app");
        return;
      }

      // Request wallet access — Freighter will pop up for approval
      const accessResult = await requestAccess();
      if (accessResult.error) {
        setConnectError("Connection rejected. Please approve in Freighter.");
        return;
      }

      // Get network details
      const networkDetails = await getNetworkDetails();
      setNetwork(networkDetails.networkPassphrase?.includes("Test") ? "Testnet" : "Mainnet");
      setWalletAddress(accessResult.address);
      setActiveTab("dashboard");
    } catch (err) {
      setConnectError("Could not connect to Freighter. Please try again.");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen pb-16" style={{ background: "var(--navy-950)" }}>
      <Navbar
        walletAddress={walletAddress}
        network={network}
        onConnect={handleConnect}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {connectError && (
        <div className="max-w-xl mx-auto mt-4 px-4">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm flex items-center" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5" }}>
            <AlertTriangle className="h-5 w-5 text-danger shrink-0 mr-2" />
            {connectError}
          </div>
        </div>
      )}

      {!walletAddress ? (
        <HeroSection onConnect={handleConnect} />
      ) : (
        <main className="max-w-6xl mx-auto px-6 py-10">
          <div className="fade-in">
            {activeTab === "dashboard" && (
              <Dashboard walletAddress={walletAddress} network={network} />
            )}
            {activeTab === "admin" && (
              <ManagerPortal walletAddress={walletAddress} />
            )}
          </div>
        </main>
      )}
    </div>
  );
}
