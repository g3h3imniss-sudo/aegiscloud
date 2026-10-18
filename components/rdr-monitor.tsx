"use client";

import { useState } from "react";

type Change = {
  id: number;
  object_key: string;
  change_type: "added" | "modified" | "deleted";
  previous_etag: string | null;
  current_etag: string | null;
  source: string;
  actor: string | null;
  request_id: string | null;
  observed_at: string;
};

type State = {
  bucket: string;
  baselineAt: string | null;
  baselineCount: number;
  events: Change[];
};

const labels: Record<Change["change_type"], string> = {
  added: "əlavə edildi",
  modified: "dəyişdirildi",
  deleted: "silindi",
};

const recommendations: Record<Change["change_type"], string> = {
  added: "Sahibliyi yoxlayın; təsdiq etmədən baseline-i yeniləməyin.",
  modified: "R2-də obyektin mənbəyini və ETag dəyişikliyini araşdırın.",
  deleted: "R2-də ehtiyat nüsxə və ya başqa bərpa mənbəyi olub-olmadığını yoxlayın.",
};

export default function RdrMonitor() {
  const [token, setToken] = useState("");
  const [state, setState] = useState<State | null>(null);
  const [latest, setLatest] = useState<Change[]>([]);
  const [summary, setSummary] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setError("");
    const response = await fetch("/api/rdr", {
      headers: { "x-admin-token": token },
    });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      throw new Error(result.error ?? "Monitorinq məlumatlarını yükləmək alınmadı.");
    }
    setState(result as State);
  }

  async function run(action: "baseline" | "scan") {
    if (action === "baseline" && state?.baselineAt) {
      const confirmed = window.confirm(
        "Mövcud baseline yenisi ilə əvəzlənsin? Bu, əvvəlki müqayisə nöqtəsini dəyişəcək.",
      );
      if (!confirmed) return;
    }
    setBusy(true);
    setError("");
    setLatest([]);
    setSummary("");
    try {
      const response = await fetch("/api/rdr", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-admin-token": token,
        },
        body: JSON.stringify({ action }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Monitorinq əməliyyatı alınmadı.");
      }
      if (action === "scan") setLatest(result.changes ?? []);
      setSummary(
        action === "baseline"
          ? `${result.objectCount} obyekt baseline-a yazıldı.`
          : `${result.checked} obyekt yoxlanıldı; ${result.totalChanges} dəyişiklik tapıldı.`,
      );
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Monitorinq əməliyyatı alınmadı.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel p-5">
      <div className="flex flex-wrap gap-3">
        <input
          value={token}
          onChange={(event) => setToken(event.target.value)}
          type="password"
          autoComplete="off"
          placeholder="operator tokeni (ən azı 32 simvol)"
          className="mono min-w-60 flex-1 rounded-sm border border-line bg-black/30 px-3 py-2 text-xs outline-none focus:border-accent/60"
        />
        <button
          disabled={busy}
          onClick={() => {
            setBusy(true);
            load()
              .catch((cause: unknown) =>
                setError(
                  cause instanceof Error
                    ? cause.message
                    : "Monitorinq məlumatlarını yükləmək alınmadı.",
                ),
              )
              .finally(() => setBusy(false));
          }}
          className="rounded-sm border border-line px-3 py-2 text-xs text-muted hover:border-accent/50 hover:text-accent disabled:opacity-40"
        >
          statusu yüklə
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          disabled={busy || token.length < 32}
          onClick={() => run("baseline")}
          className="rounded-sm bg-accent px-4 py-2 text-xs font-semibold text-[#0b0b0d] disabled:opacity-40"
        >
          baseline yarat
        </button>
        <button
          disabled={busy || token.length < 32 || !state?.baselineAt}
          onClick={() => run("scan")}
          className="rounded-sm border border-line px-4 py-2 text-xs text-muted hover:border-accent/50 hover:text-accent disabled:opacity-40"
        >
          R2-ni yoxla
        </button>
        {busy && <span className="mono self-center text-xs text-accent">yoxlanır…</span>}
      </div>

      {error && <p className="mono mt-3 text-xs text-[#d97a5f]">{error}</p>}
      {summary && <p className="mono mt-3 text-xs text-accent-2">{summary}</p>}
      {state && (
        <div className="mono mt-4 grid gap-2 border-t border-line pt-4 text-xs sm:grid-cols-3">
          <p><span className="text-muted">bucket: </span>{state.bucket}</p>
          <p><span className="text-muted">baseline obyektləri: </span>{state.baselineCount}</p>
          <p>
            <span className="text-muted">baseline vaxtı: </span>
            {state.baselineAt ?? "yaradılmayıb"}
          </p>
        </div>
      )}

      {latest.length > 0 && (
        <div className="mt-4 max-h-64 overflow-auto border-t border-line pt-2">
          {latest.map((change, index) => (
            <div key={`${change.object_key}-${index}`} className="border-b border-line-soft py-2">
              <p className="mono truncate text-xs">
                <span className="text-accent">{labels[change.change_type]}</span>
                <span className="text-muted"> · {change.object_key}</span>
              </p>
              <p className="mt-1 text-xs text-muted">{recommendations[change.change_type]}</p>
            </div>
          ))}
        </div>
      )}
      {state?.events.length ? (
        <details className="mt-4 border-t border-line pt-3">
          <summary className="cursor-pointer text-xs text-muted">
            Son dəyişiklik tarixçəsi ({state.events.length})
          </summary>
          <div className="mt-2 max-h-56 overflow-auto">
            {state.events.map((event) => (
              <div key={event.id} className="border-b border-line-soft py-2">
                <p className="mono truncate text-xs text-muted">
                  {event.observed_at} · {event.source === "r2-queue" ? "R2 event" : "baseline"}
                  {" · "}{labels[event.change_type]} · {event.object_key}
                  {event.actor ? ` · ${event.actor}` : ""}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {recommendations[event.change_type]}
                </p>
              </div>
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}
