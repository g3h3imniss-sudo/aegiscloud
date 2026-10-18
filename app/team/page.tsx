import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Komanda və idarəetmə · AegisCloud",
  description:
    "Xəyali komanda, RACI matrisi, W1-W12 yol xəritəsi və layihə idarəetmə alətləri.",
};

const team = [
  { name: "Aysel Məmmədova", role: "Layihə Meneceri / GRC Lead", area: "İSMS", init: "AM", focus: "Sprint planı, risk qeydiyyatı, ISO 27001 SoA, hesabat" },
  { name: "Rəşad Əliyev", role: "Security Architect", area: "Bulud təhlükəsizliyi", init: "RƏ", focus: "R2 token scope-u, Vercel, Supabase, monitorinq, paylaşılan məsuliyyət" },
  { name: "Nərmin Quliyeva", role: "Kriptoqrafiya Mühəndisi", area: "Kriptoqrafiya", init: "NQ", focus: "AES-GCM, imza sxemləri, açar idarəsi, TLS" },
  { name: "Elvin Həsənov", role: "Backend Developer", area: "Tətbiq", init: "EH", focus: "API, RBAC, BOLA qorunması, audit log" },
  { name: "Tural İsmayılov", role: "Frontend Developer", area: "Tətbiq", init: "Tİ", focus: "Next.js UI, kripto laboratoriyası interfeysi" },
  { name: "Günel Rzayeva", role: "DevOps / QA", area: "Bulud + test", init: "GR", focus: "CI/CD, konteynerlər, avtomatik testlər, deploy" },
];

const workstreams = [
  "Kriptoqrafiya modulu",
  "Bulud infrastrukturu",
  "İSMS sənədləşməsi",
  "Backend / API",
  "Frontend",
  "CI/CD və test",
];

const roads = [
  ["W1-W2", "Tələblər, arxitektura, riskin ilkin qiymətləndirməsi"],
  ["W3-W4", "Kripto modulu: AES-GCM, hash, imza"],
  ["W5-W6", "Backend API, RBAC, audit log"],
  ["W7-W8", "Bulud: Cloudflare R2, token scope-u, Supabase, monitorinq"],
  ["W9-W10", "İSMS: SoA, IR planı, BCP/DRP"],
  ["W11-W12", "Testlər, pentest, deploy, təqdimat"],
];

const tools = [
  ["GitHub Projects", "Task, sprint, issue idarəsi"],
  ["Notion", "İSMS/GRC sənədləri, siyasətlər"],
  ["GitHub Actions", "CI/CD: lint, test, deploy"],
  ["Vercel", "Frontend hostinqi və preview"],
  ["Cloudflare", "DNS + WAF"],
];

// R = icra edir, A = cavabdeh, C = məsləhət, I = məlumatlandırılır
const raci: Record<string, string> = {
  "Kriptoqrafiya modulu": "C/I/R/A/I/C",
  "Bulud infrastrukturu": "I/C/I/I/I/R",
  "İSMS sənədləşməsi": "A/C/C/C/I/C",
  "Backend / API": "I/I/I/A/I/C",
  "Frontend": "I/I/I/C/A/C",
  "CI/CD və test": "I/I/I/C/C/R",
};

export default function TeamPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <span className="text-xs font-semibold uppercase tracking-wider text-accent-2">
        Layihə idarəetməsi
      </span>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        Komanda və İdarəetmə
      </h1>
      <p className="mt-3 max-w-3xl text-muted">
        AegisCloud altı nəfərlik çarpaz-funksional komanda tərəfindən, Agile
        (Scrum) prinsipləri ilə 12 həftəlik plan çərçivəsində hazırlanmışdır.
        Rollar ayrı-ayrı sahələr üzrə bölünüb.
      </p>

      {/* Team */}
      <h2 className="mt-12 text-xl font-semibold">Komanda</h2>
      <div className="mt-6 grid gap-x-10 gap-y-4 md:grid-cols-2">
        {team.map((m) => (
          <div key={m.name} className="flex gap-3 border-t border-line pt-4">
            <span className="mono grid h-9 w-9 shrink-0 place-items-center rounded-full border border-accent/40 text-xs text-accent">
              {m.init}
            </span>
            <div>
              <p className="font-medium">{m.name}</p>
              <p className="mono text-[11px] text-muted">
                {m.role} · {m.area}
              </p>
              <p className="mt-1 text-sm text-muted">{m.focus}</p>
            </div>
          </div>
        ))}
      </div>

      {/* RACI */}
      <h2 className="mt-14 text-xl font-semibold">RACI məsuliyyət matrisi</h2>
      <p className="mt-2 max-w-3xl text-sm text-muted">
        Hər iş axını üzrə kimin icra etdiyi (R), kimin cavabdeh olduğu (A), kimin
        məsləhət verdiyi (C) və kimin məlumatlandırıldığı (I) müəyyən edilib.
      </p>
      <div className="panel mt-5 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3">İş axını</th>
              {team.map((m) => (
                <th key={m.init} className="px-3 py-3 text-center">
                  {m.init}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {workstreams.map((w) => (
              <tr key={w} className="border-b border-line/50 last:border-0">
                <td className="px-4 py-3 text-muted">{w}</td>
                {raci[w].split("/").map((v, i) => (
                  <td key={i} className="px-3 py-3 text-center">
                    <span
                      className={`mono text-xs ${
                        v === "A"
                          ? "text-accent"
                          : v === "R"
                            ? "text-accent-2"
                            : "text-muted"
                      }`}
                    >
                      {v}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Roadmap + tools */}
      <div className="mt-14 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold">12 həftəlik plan</h2>
          <div className="mt-5 space-y-3">
            {roads.map(([w, d], i) => (
              <div key={w} className="panel flex items-center gap-4 p-4">
                <span className="mono w-20 shrink-0 text-sm text-accent">{w}</span>
                <span className="text-sm text-muted">{d}</span>
                <span className="ml-auto text-xs text-muted">
                  {i < 2 ? "tamamlandı" : "davam edir"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Alətlər</h2>
          <div className="mt-4">{tools.map(([t, d]) => (<div key={t} className="border-t border-line py-3"><p className="mono text-sm">{t}</p><p className="mt-0.5 text-xs text-muted">{d}</p></div>))}</div>
        </div>
      </div>

      {/* Governance */}
      <h2 className="mt-14 text-xl font-semibold">İdarəetmə qaydaları</h2>
      <div className="mt-6 grid gap-x-10 gap-y-4 md:grid-cols-2">
        {[
          ["Sprint", "2 həftəlik, planlama + review"],
          ["Code Review", "Hər dəyişiklik PR ilə, ən azı 1 təsdiq"],
          ["Definition of Done", "Test keçir, lint təmiz, sənədləşdirilib"],
          ["Retrospektiv", "Hər sprint sonu proses təkmilləşdirmə"],
        ].map(([t, d]) => (
          <div key={t} className="border-t border-line pt-3">
            <p className="font-medium">{t}</p>
            <p className="mt-0.5 text-sm text-muted">{d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
