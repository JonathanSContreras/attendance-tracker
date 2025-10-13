"use client";

import { useEffect, useState } from "react";

export default function Admin() {
  const [sessions, setSessions] = useState<{ id: number; date: string }[]>([]);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [toast, setToast] = useState<{ msg: string; kind: "success" | "error" | null }>({ msg: "", kind: null });

  function showToast(msg: string, kind: "success" | "error" = "success") {
    setToast({ msg, kind });
    setTimeout(() => setToast({ msg: "", kind: null }), 3000);
  }

  async function loadSessions() {
    const s = await fetch("/api/sessions").then((r) => r.json());
    setSessions(s);
  }

  useEffect(() => {
    loadSessions();
  }, []);

  async function ensureSession() {
    await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date }),
    });
    await loadSessions();
    showToast(`Session created for ${date}`);
  }

  async function clearSession() {
    if (!confirm(`Clear all check-ins for ${date}? This cannot be undone.`)) return;
    const res = await fetch("/api/clear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date }),
    });
    const data = await res.json();
    if (data.ok) {
      await loadSessions();
      showToast(`Cleared ${data.cleared} check-in(s) for ${date}`);
    } else {
      showToast(data.error || "Failed to clear session", "error");
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-4xl font-bold text-gray-800">Attendance Admin</h1>
          <p className="text-gray-600 mt-2">Manage sessions, import rosters, and export attendance data</p>
        </div>

        {/* Quick Actions Card */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="/kiosk"
              target="_blank"
              className="flex items-center justify-center gap-2 px-6 py-4 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Open Check-In Kiosk
            </a>
            <a
              href="/api/export"
              className="flex items-center justify-center gap-2 px-6 py-4 rounded-lg bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download Excel Report
            </a>
          </div>
        </div>

        {/* Session Management */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Session Management</h2>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 items-center">
              <input
                type="date"
                className="border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none text-lg text-gray-700"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              <button
                className="px-5 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-md"
                onClick={ensureSession}
              >
                Create Session
              </button>
              <button
                className="px-5 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors shadow-md"
                onClick={clearSession}
              >
                Clear Session
              </button>
            </div>

            {sessions.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-sm font-semibold text-gray-700 mb-2">Active Sessions ({sessions.length})</p>
                <div className="flex flex-wrap gap-2">
                  {sessions.map((s) => (
                    <span
                      key={s.id}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                    >
                      {s.date.slice(0, 10)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Import Excel */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Import Roster</h2>
          <form
            method="post"
            action="/api/import"
            encType="multipart/form-data"
            className="space-y-4"
          >
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition-colors">
              <input
                type="file"
                name="file"
                accept=".xlsx,.xls"
                className="w-full text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            <button
              type="submit"
              className="w-full px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors shadow-md"
            >
              Upload & Import
            </button>
          </form>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-900 font-medium mb-2">Expected Format:</p>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>Column A: <code className="bg-white px-2 py-0.5 rounded">ID</code> (Student ID)</li>
              <li>Column B: <code className="bg-white px-2 py-0.5 rounded">Name</code> (Full name)</li>
              <li>Column C: <code className="bg-white px-2 py-0.5 rounded">Email</code> (Email address)</li>
              <li>Remaining columns: Date headers (one per session)</li>
            </ul>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg shadow-lg p-6 border border-purple-200">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">How to Use</h2>
          <ol className="space-y-3 text-gray-700">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
              <span>Upload your existing Excel roster using the import section above</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
              <span>Create a session for today or open the check-in kiosk</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
              <span>Students tap their name on the kiosk to mark attendance</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
              <span>Download Excel report anytime to see present/absent status</span>
            </li>
          </ol>
        </div>
      </div>

      {/* Toast Notification */}
      {toast.kind && (
        <div
          className={`fixed bottom-6 right-6 px-6 py-4 rounded-lg shadow-xl text-white font-semibold ${
            toast.kind === "success" ? "bg-green-600" : "bg-red-600"
          }`}
          role="status"
          aria-live="polite"
        >
          {toast.msg}
        </div>
      )}
    </main>
  );
}
