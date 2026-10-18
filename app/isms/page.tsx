import type { Metadata } from "next";
import RiskRegister from "@/components/risk-register";
import Reveal from "@/components/reveal";

export const metadata: Metadata = {
  title: "İSMS / ISO 27001 · AegisCloud",
  description:
    "ISO/IEC 27001:2022 əsaslı informasiya təhlükəsizliyi idarəetmə sistemi: nəzarətlər, risklər, insident cavabı.",
};

const themes = [
  { id: "A.5", n: "Təşkilati nəzarətlər", c: 37, d: "Siyasətlər, rollar, təchizatçı və bulud münasibətləri, hadisə idarəsi." },
  { id: "A.6", n: "İnsan nəzarətləri", c: 8, d: "İşə qəbul, təlim, məsuliyyətdən azad etmə prosesləri." },
  { id: "A.7", n: "Fiziki nəzarətlər", c: 14, d: "Fiziki giriş, avadanlıq mühafizəsi (buludda provayderə keçir)." },
  { id: "A.8", n: "Texnoloji nəzarətlər", c: 34, d: "Giriş, kriptoqrafiya, loglama, texniki zəiflik idarəsi." },
];

const soa = [
  { id: "A.5.1", n: "İnformasiya təhlükəsizliyi siyasətləri", s: "Tətbiq olunub" },
  { id: "A.5.15", n: "Giriş nəzarəti", s: "Tətbiq olunub" },
  { id: "A.5.23", n: "Bulud xidmətlərinin təhlükəsizliyi", s: "Tətbiq olunub" },
  { id: "A.8.2", n: "İmtiyazlı giriş hüquqları", s: "Tətbiq olunub" },
  { id: "A.8.7", n: "Zərərli koddan müdafiə", s: "Qismən" },
  { id: "A.8.8", n: "Texniki zəifliklərin idarəsi", s: "Tətbiq olunub" },
  { id: "A.8.15", n: "Loglama", s: "Tətbiq olunub" },
  { id: "A.8.16", n: "Monitorinq fəaliyyətləri", s: "Qismən" },
  { id: "A.8.24", n: "Kriptoqrafiyanın istifadəsi", s: "Tətbiq olunub" },
  { id: "A.8.28", n: "Təhlükəsiz kodlaşdırma", s: "Tətbiq olunub" },
  { id: "A.5.24", n: "Hadisənin idarəsi: planlaşdırma", s: "Tətbiq olunub" },
  { id: "A.5.29", n: "Fasilə zamanı məlumat təhlükəsizliyi", s: "Planlaşdırılır" },
];

const ir = [
  ["Hazırlıq", "Komandanın təyin edilməsi, əlaqə kanalları, alətlərin hazır saxlanması."],
  ["Müəyyən etmə", "Alertin təsdiqi, təsir dairəsinin və şiddətin qiymətləndirilməsi."],
  ["Lokallaşdırma", "Zərərin yayılmasının dayandırılması; zəruri halda hesabın dondurulması."],
  ["Aradan qaldırma", "Kök səbəbin tapılması və aradan qaldırılması."],
  ["Bərpa", "Yoxlanılmış backup-dan bərpa; bütövlüyün təsdiqi."],
  ["Dərslər", "İnsident sonrası report, nəzarətlərin yenilənməsi."],
];

const docs = [
  { id: "ISMS-01", cat: "Risk Management", t: "Risk Qeydiyyatı", d: "Bulud təhdidlərinin kəmiyyət qiymətləndirməsi və nəzarət xəritəsi.", tags: ["A.5.1", "A.5.7"], status: "Təsdiqlənib", v: "v1.4" },
  { id: "ISMS-02", cat: "Continuity", t: "BCP / DRP", d: "Fasilə və bərpa planı. RTO 4 saat, RPO 1 saat.", tags: ["A.5.29", "A.5.30"], status: "Əməliyyatda", v: "v2.1" },
  { id: "ISMS-03", cat: "Operations", t: "İnsident Cavabı Playbook", d: "6 mərhələli IR prosesi və eskalasiya prosedurları.", tags: ["A.5.24"], status: "Aktiv", v: "v2.0" },
  { id: "ISMS-04", cat: "Compliance", t: "Statement of Applicability", d: "ISO 27001:2022 Annex A üçün nümunə uyğunluq bəyanı.", tags: ["ISO 27001"], status: "Nümunə", v: "v1.2" },
  { id: "ISMS-05", cat: "Cryptography", t: "Kriptoqrafiya və Açar İdarəsi", d: "AES-256-GCM, Ed25519, KMS rotasiya siyasəti.", tags: ["A.8.24"], status: "Təsdiqlənib", v: "v1.1" },
  { id: "ISMS-06", cat: "Forensics", t: "Audit və Sübut Siyasəti", d: "Hash-zəncirli log və forensic sübut zənciri.", tags: ["A.8.15"], status: "Aktiv", v: "v1.0" },
];

const statusColor = (s: string) =>
  s === "Tətbiq olunub"
    ? "border-accent-2/50 bg-accent-2/10 text-accent-2"
    : s === "Qismən"
      ? "border-accent/50 bg-accent/10 text-accent"
      : "border-line bg-panel text-muted";

export default function IsmsPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <span className="text-xs font-semibold uppercase tracking-wider text-accent-2">
        İSMS / ISO 27001
      </span>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        İSMS və ISO/IEC 27001:2022
      </h1>
      <p className="mt-3 max-w-3xl text-muted">
        İSMS texnologiya deyil, idarəetmə sistemidir: hansı aktivlərin qorunduğunu,
        hansı risklərin mövcud olduğunu və hansı nəzarətlərin tətbiq edildiyini
        sənədləşdirir. AegisCloud-un İSMS-i ISO/IEC 27001:2022 strukturuna əsaslanır.
      </p>
      <p className="mt-3 max-w-3xl border-l-2 border-accent/60 pl-3 text-xs text-muted">
        Bu səhifədəki nəzarət statusları, siyasət sənədləri, risklər və RTO/RPO
        rəqəmləri nümunədir. Audit sübutu, təşkilatın real SoA-sı və ya ISO
        sertifikatı kimi qəbul edilməməlidir.
      </p>

      {/* Themes */}
      <h2 className="mt-12 text-xl font-semibold">Annex A nəzarət qrupları</h2>
      <div className="mt-6 grid gap-x-10 gap-y-5 md:grid-cols-2">
        {themes.map((t) => (
          <div key={t.id} className="border-t border-line pt-4">
            <div className="mono flex items-baseline justify-between text-xs">
              <span className="text-accent">{t.id}</span>
              <span className="text-muted">{t.c} nəzarət</span>
            </div>
            <p className="mt-1 font-medium">{t.n}</p>
            <p className="mt-0.5 text-xs text-muted">{t.d}</p>
          </div>
        ))}
      </div>

      {/* SoA */}
      <h2 className="mt-14 text-xl font-semibold">
        Uyğunluq bəyanı (Statement of Applicability)
      </h2>
      <p className="mt-2 max-w-3xl text-sm text-muted">
        Hansı nəzarətlərin tətbiq edildiyini və nə dərəcədə yetkin olduğunu
        göstərən cədvəl.
      </p>
      <div className="panel mt-5 overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3">Nəzarət</th>
              <th className="px-4 py-3">Ad</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {soa.map((x) => (
              <tr key={x.id} className="border-b border-line/50 last:border-0">
                <td className="mono px-4 py-3 text-accent-2">{x.id}</td>
                <td className="px-4 py-3 text-muted">{x.n}</td>
                <td className="px-4 py-3">
                  <span className={`rounded border px-2 py-0.5 text-[11px] ${statusColor(x.s)}`}>
                    {x.s}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Documents */}
      <h2 className="mt-14 text-xl font-semibold">İSMS sənədləri və təchizatlar</h2>
      <p className="mt-2 max-w-3xl text-sm text-muted">
        İdarəetmə sisteminin sübut paketi: siyasətlər, risk analizi, plan və
        prosedurlar.
      </p>
      <div className="mt-4">
        {docs.map((d, i) => (
          <Reveal key={d.id} delay={(i % 2) * 60}>
            <div className="border-t border-line py-5">
              <div className="mono flex items-center justify-between gap-3 text-[11px]">
                <span className="text-accent-2">
                  {d.id} · {d.cat}
                </span>
                <span className="text-muted">{d.status}</span>
              </div>
              <h3 className="mt-1.5 font-semibold">{d.t}</h3>
              <p className="mt-1 text-sm text-muted">{d.d}</p>
              <div className="mono mt-2 flex flex-wrap gap-3 text-[10px] text-muted">
                {d.tags.map((t) => (
                  <span key={t}>{t}</span>
                ))}
                <span className="ml-auto">{d.v}</span>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      {/* Risk register */}
      <h2 className="mt-14 text-xl font-semibold">Risk qeydiyyatı</h2>
      <p className="mt-2 max-w-3xl text-sm text-muted">
        Hər risk Ehtimal × Təsir balı ilə qiymətləndirilir və ona uyğun nəzarət
        təyin olunur. Aşağıdaki qeydiyyata risk əlavə edin və balın dəyişdiyini
        görün.
      </p>
      <div className="mt-5">
        <RiskRegister />
      </div>

      {/* IR playbook */}
      <h2 className="mt-14 text-xl font-semibold">İnsident cavabı (IR): 6 mərhələ</h2>
      <div className="mt-6 grid gap-x-10 gap-y-5 md:grid-cols-2">
        {ir.map(([t, d], i) => (
          <div key={t} className="border-t border-line pt-4">
            <span className="mono text-xs text-accent">0{i + 1}</span>
            <p className="mt-1 font-medium">{t}</p>
            <p className="mt-0.5 text-sm text-muted">{d}</p>
          </div>
        ))}
      </div>

      {/* BCP/DRP + policies */}
      <div className="mt-14 grid gap-5 md:grid-cols-2">
        <div className="border-t border-line pt-5">
          <h3 className="text-sm font-semibold text-accent">BCP / DRP (fasilə və bərpa)</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>· Backup: ayrıca R2-dən kənar nüsxə konfiqurasiyası və sınaq tələb edir</li>
            <li>· Nümunə RTO hədəfi: 4 saat (təsdiqlənməyib)</li>
            <li>· Nümunə RPO hədəfi: 1 saat (təsdiqlənməyib)</li>
            <li>· Bərpa testi: bu tətbiqdə həyata keçirilmir</li>
          </ul>
        </div>
        <div className="border-t border-line pt-5">
          <h3 className="text-sm font-semibold text-accent">Siyasətlər</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>· Məlumat təsnifatı (ictimai, daxili, məxfi)</li>
            <li>· Giriş nəzarəti və parol siyasəti</li>
            <li>· Loglama və audit siyasəti</li>
            <li>· İnsident idarəsi siyasəti</li>
            <li>· Təchizatçı/bulud xidməti siyasəti</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
