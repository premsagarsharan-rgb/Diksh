// components/dashboard/Trash.js
"use client";

import { useEffect, useState } from "react";
import BufferSpinner from "@/components/BufferSpinner";

function safeId(x) {
  if (!x) return "";
  if (typeof x === "string") return x;
  if (typeof x === "object" && x.$oid) return String(x.$oid);
  return String(x);
}

function formatDate(d) {
  if (!d) return "—";
  try {
    const date = new Date(d);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function formatTime(d) {
  if (!d) return "";
  try {
    const date = new Date(d);
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function Trash({ role, session }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function loadTrash() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/trash");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "Failed to load trash");
        setItems([]);
        return;
      }
      setItems(data.items || []);
    } catch (e) {
      console.error("loadTrash failed", e);
      setError("Network error");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTrash();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <BufferSpinner size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4">
        <div className="text-sm font-semibold text-red-200">Error</div>
        <div className="text-xs text-red-200/80 mt-1">{error}</div>
        <button
          onClick={loadTrash}
          className="mt-3 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs"
        >
          Retry
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
        <div className="text-4xl mb-3">🗑️</div>
        <div className="text-lg font-semibold text-white/80">Trash is Empty</div>
        <div className="text-sm text-white/50 mt-1">
          No rejected customers found.
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs text-white/60">TRASH</div>
          <div className="text-sm text-white/80 mt-0.5">
            {items.length} rejected {items.length === 1 ? "card" : "cards"}
          </div>
        </div>
        <button
          onClick={loadTrash}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs"
        >
          Refresh
        </button>
      </div>

      {/* Cards Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((item) => {
          const cust = item.customer;
          const cont = item.container;
          const custName = cust?.name || "Unknown";
          const custAddress = cust?.address || "—";
          const custGender = cust?.gender || "—";
          const custPhone = cust?.phone || cust?.whatsappWelcomeTo || "—";
          const containerDate = cont?.date || item?.occupiedDate || "—";
          const containerMode = cont?.mode || "MEETING";
          const trashedAt = item.trashedAt || item.rejectedAt;
          const kind = item.kind || "SINGLE";

          return (
            <div
              key={safeId(item._id)}
              className="rounded-2xl border border-red-400/15 bg-black/30 p-4 hover:bg-black/35 transition"
            >
              {/* Top Row: Badge + Kind */}
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-red-500/15 border border-red-400/20 text-red-300">
                  🗑️ REJECTED
                </span>
                <span className="text-[10px] text-white/50 uppercase">{kind}</span>
              </div>

              {/* Customer Info */}
              <div className="mt-1">
                <div className="font-semibold text-white truncate">{custName}</div>
                <div className="text-xs text-white/60 truncate mt-0.5">{custAddress}</div>
              </div>

              {/* Details */}
              <div className="mt-3 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/50">Gender</span>
                  <span className="text-white/80">{custGender}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/50">Phone</span>
                  <span className="text-white/80">{custPhone}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/50">From Container</span>
                  <span className="text-white/80">{containerDate} / {containerMode}</span>
                </div>
                {item.occupiedDate && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/50">Occupied Date</span>
                    <span className="text-emerald-300/80">{item.occupiedDate}</span>
                  </div>
                )}
              </div>

              {/* Footer: Trashed time */}
              <div className="mt-3 pt-2 border-t border-white/5">
                <div className="text-[10px] text-white/40">
                  Trashed: {formatDate(trashedAt)} {formatTime(trashedAt)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
