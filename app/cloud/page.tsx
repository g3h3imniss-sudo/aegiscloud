import type { Metadata } from "next";
import IamDemo from "@/components/iam-demo";
import LiveCheck from "@/components/live-check";
import RdrMonitor from "@/components/rdr-monitor";
import StoragePanel from "@/components/storage-panel";

export const metadata: Metadata = {
  title: "Bulud təhlükəsizliyi · AegisCloud",
  description:
    "Real istifadə olunan bulud xidmətləri, IaaS/PaaS/SaaS modeli, IAM və canlı yoxlama.",
};

const services = [
  { n: "Vercel", lvl: "PaaS", role: "Next.js deploy hədəfi", ctl: "HTTPS və deployment ayarları ayrıca yoxlanmalıdır" },
  { n: "Cloudflare R2", lvl: "PaaS", role: "Obyekt saxlama və metadata", ctl: "Private bucket və yalnız bucket-ə scope olunmuş R2 tokeni" },
  { n: "Supabase (Postgres)", lvl: "PaaS", role: "Audit, risklər və RDR baseline/event tarixçəsi", ctl: "RLS, server tərəfdə service-role key" },
  { n: "GitHub", lvl: "SaaS", role: "Repo və CI workflow (konfiqurasiya olunarsa)", ctl: "Repo privacy və branch rules ayrıca qurulur" },
];

const model = [
  { t: "IaaS", d: "İnfrastruktur provayderdə, əməliyyat sistemi və runtime səndə qalır. Nümunə: EC2, VPC." },
  { t: "PaaS", d: "Platformanı provayder idarə edir, sən tətbiqi verirsən. Nümunə: Vercel, Supabase." },
  { t: "SaaS", d: "Hazır servisi istifadə edirsən. Nümunə: GitHub." },
];

const respRows = [
  { item: "Məlumatın təsnifatı və şifrələnməsi", iaas: "Müştəri", paas: "Müştəri", saas: "Müştəri" },
  { item: "Tətbiq kodu və konfiqurasiya", iaas: "Müştəri", paas: "Müştəri", saas: "Provayder" },
  { item: "Runtime və middleware", iaas: "Müştəri", paas: "Provayder", saas: "Provayder" },
  { item: "Əməliyyat sistemi və yamaqlar", iaas: "Müştəri", paas: "Provayder", saas: "Provayder" },
  { item: "Virtualizasiya və host", iaas: "Provayder", paas: "Provayder", saas: "Provayder" },
  { item: "Fiziki təhlükəsizlik", iaas: "Provayder", paas: "Provayder", saas: "Provayder" },
];

const monitoring = [
  ["Vercel", "Deployment logları və analytics."],
  ["Supabase", "Hash-zəncirli audit ledger (kim, nə vaxt, hansı domeni yoxladı) və risk qeydiyyatı."],
  ["GitHub Actions", "Hər push-da lint və build."],
];

function lvlColor(l: string) {
  if (l === "IaaS") return "text-accent border-accent/40 bg-accent/10";
  if (l === "PaaS") return "text-accent-2 border-accent-2/40 bg-accent-2/10";
  return "text-muted border-line bg-panel-2";
}

export default function CloudPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <span className="mono text-xs text-accent-2">bulud təhlükəsizliyi</span>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        Bulud Təhlükəsizliyi
      </h1>
      <p className="mt-3 max-w-3xl text-muted">
        AegisCloud buludda işləyir.         Aşağıda stek, IaaS / PaaS / SaaS səviyyələri, IAM nümunəsi və
        Cloudflare/Vercel/Supabase-də ayrıca qurulmalı olan nəzarətlər göstərilir.
      </p>

      {/* Services */}
      <h2 className="mt-12 text-xl font-semibold">Stek</h2>
      <div className="panel mt-5 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-line mono text-xs text-muted">
            <tr>
              <th className="px-4 py-3">xidmət</th>
              <th className="px-4 py-3">səviyyə</th>
              <th className="px-4 py-3">rolu</th>
              <th className="px-4 py-3">nəzarət</th>
            </tr>
          </thead>
          <tbody>
            {services.map((s) => (
              <tr key={s.n} className="border-b border-line/50 last:border-0">
                <td className="mono px-4 py-3 text-foreground">{s.n}</td>
                <td className="px-4 py-3">
                  <span className={`mono rounded-sm border px-2 py-0.5 text-[11px] ${lvlColor(s.lvl)}`}>
                    {s.lvl}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted">{s.role}</td>
                <td className="px-4 py-3 text-muted">{s.ctl}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Model */}
      <h2 className="mt-14 text-xl font-semibold">Bulud səviyyələri</h2>
      <div className="mt-5">
        {model.map((m) => (
          <div key={m.t} className="grid gap-2 border-t border-line py-5 md:grid-cols-[160px_1fr] md:gap-6">
            <span className="mono text-sm text-accent">{m.t}</span>
            <span className="text-sm text-muted">{m.d}</span>
          </div>
        ))}
      </div>

      {/* Shared responsibility */}
      <h2 className="mt-14 text-xl font-semibold">Paylaşılan məsuliyyət modeli</h2>
      <p className="mt-2 max-w-3xl text-sm text-muted">
        Buludda təhlükəsizlik nə tam müştərinin, nə də tam provayderin üzərinə
        düşür. Səviyyə dəyişdikcə məsuliyyət sərhədi dəyişir.
      </p>
      <div className="panel mt-5 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-line mono text-xs text-muted">
            <tr>
              <th className="px-4 py-3">qat / element</th>
              <th className="px-4 py-3">IaaS</th>
              <th className="px-4 py-3">PaaS</th>
              <th className="px-4 py-3">SaaS</th>
            </tr>
          </thead>
          <tbody>
            {respRows.map((r) => (
              <tr key={r.item} className="border-b border-line/50 last:border-0">
                <td className="px-4 py-3 text-muted">{r.item}</td>
                {[r.iaas, r.paas, r.saas].map((v, i) => (
                  <td key={i} className="px-4 py-3">
                    <span className={`text-xs ${v === "Müştəri" ? "text-accent-2" : "text-muted"}`}>
                      {v}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* IAM */}
      <h2 className="mt-14 text-xl font-semibold">IAM və minimum icazə prinsipi</h2>
      <p className="mt-2 max-w-3xl text-sm text-muted">
        Aşağıdakı lokal nümunə R2 obyekt icazəsi scope-unu simulyasiya edir;
        real Cloudflare tokenini və ya canlı hesab icazələrini yoxlamır.
      </p>
      <div className="mt-5">
        <IamDemo />
      </div>

      {/* Encryption */}
      <h2 className="mt-14 text-xl font-semibold">Şifrələmə</h2>
      <div className="mt-6 grid gap-x-10 gap-y-5 md:grid-cols-2">
        <div className="border-t border-line pt-4">
          <h3 className="mono text-sm font-semibold text-accent">in transit</h3>
          <p className="mt-2 text-sm text-muted">
            Vercel HTTPS sertifikatı verir və yeniləyir. TLS protokolunun dəqiq
            versiyası platformanın konfiqurasiyasına bağlıdır; ayrıca zəmanət kimi
            burada göstərilmir.
          </p>
        </div>
        <div className="border-t border-line pt-4">
          <h3 className="mono text-sm font-semibold text-accent">at rest</h3>
          <p className="mt-2 text-sm text-muted">
            Baza Supabase-də (Postgres) provayder səviyyəsində şifrələnir. Həssas
            məlumatın tətbiq səviyyəsində şifrələnməsi isə kripto laboratoriyasında
            AES-256-GCM ilə göstərilir.
          </p>
        </div>
      </div>

      {/* Monitoring */}
      <h2 className="mt-14 text-xl font-semibold">Monitorinq və audit</h2>
      <div className="mt-6">
        {monitoring.map(([t, d]) => (
          <div key={t} className="grid gap-2 border-t border-line py-4 md:grid-cols-[160px_1fr] md:gap-6">
            <span className="mono text-sm text-accent-2">{t}</span>
            <span className="text-sm text-muted">{d}</span>
          </div>
        ))}
      </div>

      <h2 className="mt-14 text-xl font-semibold">Obyekt saxlama</h2>
      <p className="mt-2 max-w-3xl text-sm text-muted">
        Fayllar konfiqurasiya edilmiş Cloudflare R2 bucket-də saxlanır. Bucket-i
        private saxlamaq və tokeni yalnız həmin bucket-ə scope etmək vacibdir.
      </p>
      <div className="mt-4">
        <StoragePanel />
      </div>

      <h2 className="mt-14 text-xl font-semibold">R2 dəyişiklik monitorinqi</h2>
      <p className="mt-2 max-w-3xl text-sm text-muted">
        Operator başladanda obyekt siyahısı baseline ilə müqayisə edilir.
        İstəyə bağlı R2 event notifications → Queues → Worker hadisələri qeyd edir.
        R2 versiya tarixçəsi API-si yoxdur; müqayisə metadata ilə aparılır.
        Sistem avtomatik bərpa, silmə və token dəyişiklikləri etmir.
      </p>
      <div className="mt-4">
        <RdrMonitor />
      </div>

      <h2 className="mt-14 text-xl font-semibold">Canlı yoxlama</h2>
      <p className="mt-2 max-w-3xl text-sm text-muted">
        Server işlədiyi regionu və bazadakı tarama sayını göstərir. Altdaki alətlə
        istənilən domenin TLS sertifikatını və təhlükəsizlik başlıqlarını yoxlaya
        bilərsən; nəticə Supabase-dəki audit ledger-ə yazılır.
      </p>
      <div className="mt-4">
        <LiveCheck />
      </div>
    </div>
  );
}
