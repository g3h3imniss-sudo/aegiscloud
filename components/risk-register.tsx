"use client";

import { useCallback, useState } from "react";

type Risk = {
  id: number;
  asset: string;
  threat: string;
  likelihood: number;
  impact: number;
  control: string | null;
};

function level(score: number) {
  if (score >= 20) return { t: "Kritik", c: "border-[#c4553b]/60 bg-[#c4553b]/15 text-[#d97a5f]" };
  if (score >= 12) return { t: "Yüksək", c: "border-[#c4553b]/40 bg-[#c4553b]/10 text-[#d97a5f]" };
  if (score >= 6) return { t: "Orta", c: "border-accent/50 bg-accent/10 text-accent" };
  return { t: "Aşağı", c: "border-accent-2/50 bg-accent-2/10 text-accent-2" };
}

const input =
  "w-full rounded-sm border border-line bg-black/30 px-3 py-2 text-sm outline-none focus:border-accent/60";

export default function RiskRegister() {
  const [risks, setRisks] = useState<Risk[]>([]);
  const [configured, setConfigured] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [token, setToken] = useState("");
  const [notice, setNotice] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState({
    asset: "",
    threat: "",
    likelihood: 3,
    impact: 3,
    control: "",
  });

  const load = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/risks", {
        headers: { "x-admin-token": token },
      });
      const j = (await r.json()) as {
        ok: boolean;
        configured: boolean;
        rows: Risk[];
        notice?: string;
        error?: string;
      };
      if (!r.ok || !j.ok) throw new Error(j.error ?? "Riskləri yükləmək alınmadı.");
      setConfigured(j.configured);
      setRisks(j.rows ?? []);
      setNotice(j.notice ?? "");
      setLoaded(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Riskləri yükləmək alınmadı.");
    } finally {
      setBusy(false);
    }
  }, [token]);

  async function add() {
    if (!form.asset.trim() || !form.threat.trim()) {
      setError("Aktiv və təhdid sahələri tələb olunur.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/risks", {
        method: "POST",
        headers: { "content-type": "application/json", "x-admin-token": token },
        body: JSON.stringify(form),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) setError(j.error ?? "Əlavə etmək alınmadı.");
      else {
        setForm({ asset: "", threat: "", likelihood: 3, impact: 3, control: "" });
        await load();
      }
    } catch {
      setError("Şəbəkə xətası.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    setBusy(true);
    setError("");
    try {
      const r = await fetch(`/api/risks?id=${id}`, {
        method: "DELETE",
        headers: { "x-admin-token": token },
      });
      const j = await r.json();
      if (!r.ok || !j.ok) setError(j.error ?? "Silmək alınmadı.");
      else await load();
    } catch {
      setError("Şəbəkə xətası.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {!loaded && (
        <p className="mono mb-3 text-xs text-muted">
          Riskləri görmək üçün operator tokenini daxil edib yükləyin.
        </p>
      )}
      {loaded && !configured && (
        <p className="mono mb-3 text-xs text-[#d97a5f]">
          Supabase təyin olunmayıb; risk qeydiyyatı bazaya yazılmır.
        </p>
      )}
      {loaded && configured && notice === "schema" && (
        <p className="mono mb-3 text-xs text-[#d97a5f]">
          Baza sxemi hazır deyil. Supabase SQL Editor-də{" "}
          <span className="text-accent">supabase/schema.sql</span> işə salınmalıdır.
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-line mono text-xs text-muted">
            <tr>
              <th className="px-3 py-3">id</th>
              <th className="px-3 py-3">aktiv</th>
              <th className="px-3 py-3">təhdid</th>
              <th className="px-3 py-3">eht.</th>
              <th className="px-3 py-3">təsir</th>
              <th className="px-3 py-3">risk</th>
              <th className="px-3 py-3">nəzarət</th>
              <th className="px-3 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loaded && risks.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-muted">
                  {configured ? "Hələ risk yoxdur." : "baza təyin olunmayıb"}
                </td>
              </tr>
            )}
            {loaded && risks.map((r) => {
              const score = r.likelihood * r.impact;
              const lv = level(score);
              return (
                <tr key={r.id} className="border-b border-line/60 align-top last:border-0">
                  <td className="mono px-3 py-3 text-muted">{r.id}</td>
                  <td className="px-3 py-3">{r.asset}</td>
                  <td className="px-3 py-3 text-muted">{r.threat}</td>
                  <td className="px-3 py-3 text-muted">{r.likelihood}</td>
                  <td className="px-3 py-3 text-muted">{r.impact}</td>
                  <td className="px-3 py-3">
                    <span className={`mono rounded-sm border px-2 py-0.5 text-[11px] ${lv.c}`}>
                      {score} · {lv.t}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-muted">{r.control}</td>
                  <td className="px-3 py-3">
                    <button
                      disabled={busy}
                      className="mono text-xs text-muted hover:text-[#d97a5f] disabled:opacity-40"
                      onClick={() => remove(r.id)}
                    >
                      sil
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 border-t border-line pt-5">
        <p className="text-sm font-medium">Yeni risk əlavə et</p>
        <div className="mt-3 grid gap-3 md:grid-cols-6">
          <div className="flex gap-2 md:col-span-6">
            <input
              className={input}
              type="password"
              autoComplete="off"
              placeholder="operator tokeni (ən azı 32 simvol)"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
            <button
              disabled={busy}
              className="mono whitespace-nowrap rounded-sm border border-line px-3 py-2 text-xs text-muted hover:text-accent disabled:opacity-40"
              onClick={load}
            >
              riskləri yüklə
            </button>
          </div>
          <input
            className={`${input} md:col-span-2`}
            placeholder="Aktiv"
            value={form.asset}
            onChange={(e) => setForm({ ...form, asset: e.target.value })}
          />
          <input
            className={`${input} md:col-span-2`}
            placeholder="Təhdid"
            value={form.threat}
            onChange={(e) => setForm({ ...form, threat: e.target.value })}
          />
          <select
            className={input}
            value={form.likelihood}
            onChange={(e) => setForm({ ...form, likelihood: Number(e.target.value) })}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>ehtimal {n}</option>
            ))}
          </select>
          <select
            className={input}
            value={form.impact}
            onChange={(e) => setForm({ ...form, impact: Number(e.target.value) })}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>təsir {n}</option>
            ))}
          </select>
          <input
            className={`${input} md:col-span-5`}
            placeholder="Nəzarət"
            value={form.control}
            onChange={(e) => setForm({ ...form, control: e.target.value })}
          />
          <button
            disabled={busy}
            className="mono rounded-sm bg-accent px-4 py-2 text-sm font-semibold text-[#0b0b0d] hover:bg-accent/90 disabled:opacity-40"
            onClick={add}
          >
            {busy ? "…" : "əlavə et"}
          </button>
        </div>
        {error && <p className="mono mt-3 text-xs text-[#d97a5f]">{error}</p>}
        <p className="mt-3 text-xs text-muted">
          Risk balı = ehtimal × təsir. Qeydlər Supabase-dəki <span className="mono">risks</span>{" "}
          cədvəlinə yazılır və bütün istifadəçilər üçün görünür.
        </p>
      </div>
    </div>
  );
}
