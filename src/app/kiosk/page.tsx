"use client";
import { useEffect, useMemo, useState } from "react";

type RosterItem = { id:number; sid:string; name:string; email:string };

export default function Kiosk() {
  const [roster, setRoster] = useState<RosterItem[]>([]);
  const [checkedIn, setCheckedIn] = useState<number[]>([]);
  const [q, setQ] = useState("");
  const [sessionDate, setSessionDate] = useState(() =>
    new Date().toISOString().slice(0,10)
  );

  // simple toast
  const [toast, setToast] = useState<{msg:string; kind:"ok"|"err"|null}>({msg:"", kind:null});
  function showToast(msg:string, kind:"ok"|"err"="ok") {
    setToast({ msg, kind });
    if ("vibrate" in navigator) (navigator as any).vibrate?.(kind === "ok" ? 30 : [50,30,50]);
    setTimeout(() => setToast({ msg:"", kind:null }), 1500);
  }

  // load roster once
  useEffect(() => {
    fetch("/api/roster").then(r=>r.json()).then(setRoster);
  }, []);

  // load already-checked-in for the selected date (persists across refresh)
  async function loadCheckedIn(dateStr:string) {
    const res = await fetch(`/api/checkins?date=${encodeURIComponent(dateStr)}`);
    const data = await res.json();
    if (data.ok) setCheckedIn(data.studentIds as number[]);
    else setCheckedIn([]);
  }
  useEffect(() => { loadCheckedIn(sessionDate); }, [sessionDate]);

  const filtered = useMemo(() => {
    const s = q.toLowerCase();
    return roster.filter(r =>
      !checkedIn.includes(r.id) &&
      (r.name.toLowerCase().includes(s) ||
        r.email.toLowerCase().includes(s) ||
        r.sid.toLowerCase().includes(s))
    );
  }, [roster, q, checkedIn]);

  async function checkinById(id:number) {
    const res = await fetch("/api/checkin", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ studentId: id, sessionDate }),
    });
    const data = await res.json();
    if (data.ok) {
      setCheckedIn(prev => [...prev, id]);
      setQ(""); // Clear search after check-in
      showToast("Checked in successfully!", "ok");
    } else {
      showToast(data.error || "Check-in failed", "err");
    }
  }

  async function clearSession() {
    if (!confirm("Are you sure you want to clear all check-ins for this session?")) return;
    const res = await fetch("/api/clear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: sessionDate }),
    });
    const data = await res.json();
    if (data.ok) {
      setCheckedIn([]);
      showToast(`Cleared ${data.cleared} check-ins`, "ok");
    } else {
      showToast(data.error || "Clear failed", "err");
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <h1 className="text-5xl font-bold text-gray-800 mb-2">Attendance Check-In</h1>
          <p className="text-xl text-gray-600">Tap your name to sign in</p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-lg p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{roster.length}</p>
            <p className="text-sm text-gray-600 font-medium">Total Students</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{checkedIn.length}</p>
            <p className="text-sm text-gray-600 font-medium">Checked In</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4 text-center">
            <p className="text-3xl font-bold text-orange-600">{roster.length - checkedIn.length}</p>
            <p className="text-sm text-gray-600 font-medium">Remaining</p>
          </div>
        </div>

        {/* Date & Controls */}
        <div className="bg-white rounded-xl shadow-lg p-5">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex items-center gap-3">
              <label className="text-lg font-semibold text-gray-700">Session Date:</label>
              <input
                className="border-2 border-gray-300 rounded-lg px-4 py-2 text-lg focus:border-blue-500 focus:outline-none text-gray-700"
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
              />
            </div>
            <button
              className="px-5 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors shadow-md"
              onClick={clearSession}
            >
              Clear Session
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            className="w-full border-2 border-gray-300 rounded-xl px-6 py-4 text-xl focus:border-blue-500 focus:outline-none shadow-lg placeholder:text-gray-500"
            placeholder="🔍 Search by name, ID, or email..."
            value={q}
            onChange={(e)=>setQ(e.target.value)}
            autoFocus
          />
          {q && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={() => setQ("")}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Student List */}
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="max-h-[55vh] overflow-auto">
            {filtered.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {filtered.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-5 hover:bg-blue-50 transition-colors">
                    <div className="flex flex-col flex-1">
                      <span className="text-xl font-semibold text-gray-800">{s.name}</span>
                      <span className="text-sm text-gray-500 mt-1">{s.sid} • {s.email}</span>
                    </div>
                    <button
                      className="ml-4 px-8 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white text-lg font-bold hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                      onClick={() => checkinById(s.id)}
                    >
                      Check In
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center">
                {roster.length === 0 ? (
                  <>
                    <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-xl text-gray-500 font-medium">Loading roster...</p>
                  </>
                ) : (
                  <>
                    <svg className="w-20 h-20 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-2xl text-gray-700 font-semibold">All checked in!</p>
                    <p className="text-lg text-gray-500 mt-2">Great job everyone</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast.kind && (
        <div
          className={`fixed left-1/2 -translate-x-1/2 bottom-8 px-8 py-5 rounded-2xl shadow-2xl text-white text-xl font-bold ${
            toast.kind === "ok" ? "bg-gradient-to-r from-green-500 to-green-600" : "bg-gradient-to-r from-red-500 to-red-600"
          } animate-bounce`}
          role="status"
          aria-live="polite"
        >
          {toast.msg}
        </div>
      )}
    </main>
  );
}
