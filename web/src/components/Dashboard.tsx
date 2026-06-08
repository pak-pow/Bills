"use client";

import { useState, useEffect } from "react";
import { Wallet, Users, Receipt, CheckCircle2, AlertTriangle } from "lucide-react";

interface Roommate {
  name: string;
  address: string;
  shareBps: number;
  sharePercent: number;
  role: string;
}

interface Share {
  name: string;
  amount: number;
  status: 'Paid' | 'Unpaid';
}

interface Bill {
  id: number;
  description: string;
  totalAmount: number;
  dueDate: string;
  status: 'Pending' | 'Paid';
  shares: Share[];
}

interface DashboardProps {
  walletAddress: string;
  network: string | null;
}

export default function Dashboard({ walletAddress, network }: DashboardProps) {
  const [bills, setBills] = useState<Bill[]>([]);
  const [roommates, setRoommates] = useState<Roommate[]>([]);
  const [userBalance, setUserBalance] = useState<string>("250.00");
  const [contractPoolBalance, setContractPoolBalance] = useState<string>("800.00");
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const billsRes = await fetch("http://localhost:4002/api/bills");
      const billsData = await billsRes.json();
      setBills(billsData);

      const roommatesRes = await fetch("http://localhost:4002/api/roommates");
      const roommatesData = await roommatesRes.json();
      setRoommates(roommatesData);
    } catch (err) {
      console.error("Could not fetch dashboard data.", err);
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositAmount || parseFloat(depositAmount) <= 0) return;

    setLoading(true);
    setActionMessage(null);

    // Simulate Soroban deposit transaction
    setTimeout(() => {
      setUserBalance((prev) => (parseFloat(prev) + parseFloat(depositAmount)).toFixed(2));
      setContractPoolBalance((prev) => (parseFloat(prev) + parseFloat(depositAmount)).toFixed(2));
      setDepositAmount("");
      setLoading(false);
      setActionMessage({
        type: 'success',
        text: `Successfully deposited ${depositAmount} USDC into the Palo! Bills contract.`
      });
    }, 1200);
  };

  const handlePayShare = async (billId: number, roommateName: string, amount: number) => {
    if (parseFloat(userBalance) < amount) {
      setActionMessage({
        type: 'error',
        text: `Insufficient pre-funded balance. Please deposit more USDC first.`
      });
      return;
    }

    setLoading(true);
    setActionMessage(null);

    try {
      const res = await fetch(`http://localhost:4002/api/bills/${billId}/pay`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roommateName })
      });

      if (res.ok) {
        // Deduct from pre-funded balance
        setUserBalance((prev) => (parseFloat(prev) - amount).toFixed(2));
        setActionMessage({
          type: 'success',
          text: `Paid ${amount} USDC share for ${roommateName}.`
        });
        fetchData();
      } else {
        setActionMessage({ type: 'error', text: 'Failed to process payment.' });
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Error connecting to backend API.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* LEFT COLUMN: Overview & Deposit */}
      <div className="flex flex-col gap-6">
        {/* Balance card */}
        <div className="card p-6 stat-gradient gold-glow">
          <h3 className="text-text-secondary text-sm font-semibold tracking-wide uppercase">Your Pre-funded Balance</h3>
          <p className="text-4xl font-extrabold text-gold tracking-tight mt-1 font-display">{userBalance} <span className="text-lg text-text-primary">USDC</span></p>
          <div className="flex justify-between items-center mt-6 pt-4 border-t" style={{ borderColor: "rgba(251,191,36,0.15)" }}>
            <span className="text-xs text-text-secondary">On-chain House Pool Balance:</span>
            <span className="text-sm font-bold text-text-primary">{contractPoolBalance} USDC</span>
          </div>
        </div>

        {/* Deposit Form */}
        <div className="card p-6">
          <h3 className="text-lg font-bold font-display mb-4 flex items-center gap-2">
            <Wallet className="h-5 w-5 text-gold" />
            Pre-Fund Pool
          </h3>
          <p className="text-sm text-text-secondary mb-4">
            Deposit USDC into the household contract so your split shares are automatically or easily paid when bills are charged.
          </p>
          <form onSubmit={handleDeposit} className="flex flex-col gap-3">
            <input
              type="number"
              step="0.01"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="Amount (USDC)"
              className="input-field"
              required
            />
            <button type="submit" disabled={loading} className="btn-primary w-full cursor-pointer">
              {loading ? "Approving Transaction..." : "Deposit USDC"}
            </button>
          </form>
        </div>

        {/* Roommate Splits Directory */}
        <div className="card p-6">
          <h3 className="text-lg font-bold font-display mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-gold" />
            Household Directory
          </h3>
          <div className="flex flex-col gap-4">
            {roommates.map((r, idx) => (
              <div key={idx} className="flex justify-between items-center pb-3 border-b" style={{ borderColor: "var(--surface-border)" }}>
                <div>
                  <p className="font-semibold text-text-primary flex items-center gap-1.5">
                    {r.name} 
                    {r.name === 'Alice' && <span className="text-[10px] px-1.5 py-0.5 rounded stat-gradient text-gold font-bold">Admin</span>}
                  </p>
                  <p className="text-[11px] text-text-muted font-mono">{r.address}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-text-primary">{r.sharePercent}%</p>
                  <p className="text-[10px] text-text-secondary">share ratio</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Active Split Bills */}
      <div className="md:col-span-2 flex flex-col gap-6">
        {actionMessage && (
          <div
            className="px-4 py-3 rounded-xl text-sm flex items-center gap-2"
            style={
              actionMessage.type === 'success'
                ? { background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", color: "#a7f3d0" }
                : { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5" }
            }
          >
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-danger shrink-0" />
            )}
            {actionMessage.text}
          </div>
        )}

        <div className="card p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold font-display flex items-center gap-2">
              <Receipt className="h-6 w-6 text-gold" />
              Active Household Splits
            </h3>
            <span className="badge-green">testnet</span>
          </div>

          {bills.length === 0 ? (
            <p className="text-center py-10 text-text-secondary">No active bills found.</p>
          ) : (
            <div className="flex flex-col gap-6">
              {bills.map((bill) => (
                <div
                  key={bill.id}
                  className="p-5 rounded-xl border flex flex-col gap-4"
                  style={{ background: "var(--navy-900)", borderColor: "var(--surface-border)" }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-lg font-bold text-text-primary font-display">{bill.description}</h4>
                      <p className="text-xs text-text-secondary mt-0.5">Due date: {bill.dueDate}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-extrabold text-gold">{bill.totalAmount} USDC</p>
                      <span className={bill.status === 'Paid' ? 'badge-green text-[10px]' : 'badge-yellow text-[10px]'}>
                        {bill.status}
                      </span>
                    </div>
                  </div>

                  {/* Roommate Shares */}
                  <div className="pt-3 border-t" style={{ borderColor: "rgba(251,191,36,0.08)" }}>
                    <p className="text-xs text-text-secondary font-semibold mb-3">Roommate Breakdown:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {bill.shares.map((share, sIdx) => {
                        const nameOnly = share.name.split(" ")[0];
                        const isUserShare = nameOnly === "Alice"; // In our mockup, Alice is the active wallet
                        return (
                          <div
                            key={sIdx}
                            className="p-3 rounded-lg flex flex-col justify-between gap-2 border"
                            style={{
                              background: "var(--navy-800)",
                              borderColor: share.status === 'Paid' ? 'rgba(16,185,129,0.15)' : 'rgba(251,191,36,0.08)'
                            }}
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-text-primary">{share.name}</span>
                              <span
                                className="text-[10px] font-bold"
                                style={{ color: share.status === 'Paid' ? 'var(--green)' : 'var(--red)' }}
                              >
                                {share.status}
                              </span>
                            </div>
                            <div className="flex justify-between items-center pt-2">
                              <span className="text-sm font-extrabold text-text-primary">{share.amount} USDC</span>
                              {!share.status.includes('Paid') && isUserShare && (
                                <button
                                  onClick={() => handlePayShare(bill.id, nameOnly, share.amount)}
                                  disabled={loading}
                                  className="btn-primary py-1 px-3 text-[10px]"
                                  style={{ borderRadius: "0.25rem" }}
                                >
                                  Pay Split
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
