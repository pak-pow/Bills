"use client";

import { useState, useEffect } from "react";
import { PlusCircle, Sliders, CheckCircle2, AlertTriangle, Trash2, RotateCcw } from "lucide-react";

interface Roommate {
  name: string;
  address: string;
  sharePercent: number;
  role: string;
}

interface ManagerPortalProps {
  walletAddress: string;
}

export default function ManagerPortal({ walletAddress }: ManagerPortalProps) {
  const [description, setDescription] = useState<string>("");
  const [totalAmount, setTotalAmount] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  
  // Roommates configuration state
  const [roommates, setRoommates] = useState<Roommate[]>([]);
  const [newRoommateName, setNewRoommateName] = useState<string>("");
  const [newRoommateAddress, setNewRoommateAddress] = useState<string>("");
  const [newRoommateShare, setNewRoommateShare] = useState<string>("");
  const [newRoommateRole, setNewRoommateRole] = useState<string>("Roommate");

  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchRoommates();
  }, []);

  const fetchRoommates = async () => {
    try {
      const res = await fetch("http://localhost:4002/api/roommates");
      const data = await res.json();
      setRoommates(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddRoommateLocal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoommateName || !newRoommateAddress || !newRoommateShare) return;

    const share = parseInt(newRoommateShare);
    if (isNaN(share) || share <= 0 || share > 100) {
      setMessage({ type: 'error', text: 'Split share must be a number between 1 and 100.' });
      return;
    }

    // Check if address or name already exists
    if (roommates.some(r => r.name.toLowerCase() === newRoommateName.toLowerCase())) {
      setMessage({ type: 'error', text: 'A roommate with that name already exists.' });
      return;
    }

    const newRoommate: Roommate = {
      name: newRoommateName,
      address: newRoommateAddress,
      sharePercent: share,
      role: newRoommateRole
    };

    setRoommates([...roommates, newRoommate]);
    setNewRoommateName("");
    setNewRoommateAddress("");
    setNewRoommateShare("");
    setNewRoommateRole("Roommate");
    setMessage({ type: 'success', text: `Temporarily added ${newRoommateName}. Remember to click 'Save splits' to commit.` });
  };

  const handleRemoveRoommateLocal = (name: string) => {
    setRoommates(roommates.filter(r => r.name !== name));
    setMessage({ type: 'success', text: `Removed ${name} from list. Click 'Save splits' to commit changes.` });
  };

  const handleSaveRoommates = async () => {
    setLoading(true);
    setMessage(null);

    const totalPercent = roommates.reduce((acc, curr) => acc + curr.sharePercent, 0);
    if (totalPercent !== 100) {
      setMessage({
        type: 'error',
        text: `Error: Split shares must sum to exactly 100%. Current sum: ${totalPercent}%`
      });
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("http://localhost:4002/api/roommates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newRoommates: roommates })
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Successfully saved roommate splits on-chain / API.' });
        fetchRoommates();
      } else {
        setMessage({ type: 'error', text: 'Failed to save splits.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error connecting to API.' });
    } finally {
      setLoading(false);
    }
  };

  const handleResetDefaults = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("http://localhost:4002/api/roommates/reset", {
        method: "POST"
      });
      if (res.ok) {
        const data = await res.json();
        setRoommates(data.roommates);
        setMessage({ type: 'success', text: 'Reset house splits and bills to default demo mock data.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error resetting defaults.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChargeBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !totalAmount || !dueDate) return;

    setLoading(true);
    setMessage(null);

    // Validate splits equal 100%
    const totalPercent = roommates.reduce((acc, curr) => acc + curr.sharePercent, 0);
    if (totalPercent !== 100) {
      setMessage({
        type: 'error',
        text: `Error: Split shares must sum to exactly 100%. Current sum: ${totalPercent}%`
      });
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("http://localhost:4002/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          totalAmount: parseFloat(totalAmount),
          dueDate
        })
      });

      if (res.ok) {
        setMessage({
          type: 'success',
          text: `Successfully split and charged ${description} bill dynamically!`
        });
        setDescription("");
        setTotalAmount("");
        setDueDate("");
      } else {
        setMessage({ type: 'error', text: 'Failed to split bill.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error splitting bill.' });
    } finally {
      setLoading(false);
    }
  };

  const currentTotalSplit = roommates.reduce((acc, curr) => acc + curr.sharePercent, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* LEFT COLUMN: Charge Bill & Roommate Config Form */}
      <div className="md:col-span-2 flex flex-col gap-6">
        {message && (
          <div
            className="px-4 py-3 rounded-xl text-sm flex items-center gap-2"
            style={
              message.type === 'success'
                ? { background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", color: "#a7f3d0" }
                : { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5" }
            }
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-danger shrink-0" />
            )}
            {message.text}
          </div>
        )}

        {/* 1. Add Roommate Form */}
        <div className="card p-6">
          <h3 className="text-xl font-bold font-display mb-4 flex items-center gap-2">
            <Sliders className="h-6 w-6 text-gold" />
            Configure Custom Roommates & Splits
          </h3>
          <p className="text-sm text-text-secondary mb-6">
            Add your own roommate names, wallet addresses, and split ratios.
          </p>

          <form onSubmit={handleAddRoommateLocal} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary uppercase">Roommate Name</label>
                <input
                  type="text"
                  value={newRoommateName}
                  onChange={(e) => setNewRoommateName(e.target.value)}
                  placeholder="e.g. David, Sophia"
                  className="input-field"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary uppercase">Split Share (%)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={newRoommateShare}
                  onChange={(e) => setNewRoommateShare(e.target.value)}
                  placeholder="e.g. 25"
                  className="input-field"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary uppercase">Stellar Wallet Address</label>
                <input
                  type="text"
                  value={newRoommateAddress}
                  onChange={(e) => setNewRoommateAddress(e.target.value)}
                  placeholder="e.g. G..."
                  className="input-field"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary uppercase">Role</label>
                <input
                  type="text"
                  value={newRoommateRole}
                  onChange={(e) => setNewRoommateRole(e.target.value)}
                  placeholder="Roommate, Admin, Co-signer"
                  className="input-field"
                />
              </div>
            </div>

            <button type="submit" className="btn-outline py-2.5 w-full cursor-pointer mt-2 text-xs">
              Add Roommate to Directory
            </button>
          </form>
        </div>

        {/* 2. Charge Split Bill */}
        <div className="card p-6">
          <h3 className="text-xl font-bold font-display mb-4 flex items-center gap-2">
            <PlusCircle className="h-6 w-6 text-gold" />
            Charge a Utility Bill
          </h3>
          <p className="text-sm text-text-secondary mb-6">
            Enter the bill details below. The Soroban smart contract will split the total amount dynamically according to the splits locked in the configuration.
          </p>

          <form onSubmit={handleChargeBill} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-secondary uppercase">Bill Description / Biller</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Meralco Electricity, Maynilad Water, PLDT"
                className="input-field"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary uppercase">Total Bill Amount (USDC)</label>
                <input
                  type="number"
                  step="0.01"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  placeholder="Total Amount in USDC"
                  className="input-field"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary uppercase">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || currentTotalSplit !== 100}
              className="btn-primary py-3 w-full cursor-pointer mt-4 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? "Broadcasting to Soroban..." : "Broadcast Split Bill & Charge"}
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT COLUMN: House Manager Config */}
      <div className="flex flex-col gap-6">
        <div className="card p-6 stat-gradient">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold font-display text-gold">👥 Roommate Directory</h3>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                currentTotalSplit === 100 ? "bg-green/10 text-success border border-green/20" : "bg-danger/10 text-danger border border-danger/20"
              }`}
            >
              Total: {currentTotalSplit}%
            </span>
          </div>

          <p className="text-xs text-text-secondary mb-4">
            These shares are locked in the smart contract's persistent storage. If roommates change, update this list and save.
          </p>

          <div className="flex flex-col gap-3 mb-6">
            {roommates.map((r, idx) => (
              <div key={idx} className="flex justify-between items-center py-2.5 border-b" style={{ borderColor: "rgba(251,191,36,0.12)" }}>
                <div>
                  <span className="text-sm font-semibold text-text-primary">{r.name}</span>
                  <p className="text-[10px] text-text-secondary font-mono">{r.address.substring(0, 8)}...</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-text-primary text-sm">{r.sharePercent}%</span>
                  <button
                    onClick={() => handleRemoveRoommateLocal(r.name)}
                    className="text-text-muted hover:text-danger cursor-pointer transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2.5">
            <button
              onClick={handleSaveRoommates}
              disabled={loading || currentTotalSplit !== 100}
              className="btn-primary py-2.5 w-full text-xs cursor-pointer disabled:opacity-40"
            >
              Save Splits On-Chain
            </button>

            <button
              onClick={handleResetDefaults}
              disabled={loading}
              className="btn-outline py-2.5 w-full text-xs cursor-pointer flex items-center justify-center gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              Reset to Demo Defaults
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
