import Link from "next/link";
import Reveal from "@/components/reveal";
import Counter from "@/components/counter";
import HeroTerminal from "@/components/hero-terminal";
import MerkleTree from "@/components/merkle-tree";
import Lifecycle from "@/components/lifecycle";
import Marquee from "@/components/marquee";
import ThreatRadar from "@/components/threat-radar";
import LiveCheck from "@/components/live-check";

const threats = [
  {
    t: "Obyektlərin səssiz şifrələnməsi",
    d: "Oğurlanmış API açarı ilə minlərlə obyekt şifrəli blob-lara çevrilir, amma fayl adı və uzantısı eyni qalır. Endpoint antivirusu bunu görmür, çünki fayl yerindədir.",
  },
  {
    t: "Backup-ın zəhərlənməsi",
    d: "Planlı backup artıq şifrələnmiş faylları başqa yerə kopyalayır və sağlam köhnə nüsxələri üzərinə yazır. Geriyə dönmək üçün etibarlı nöqtə qalmır.",
  },
  {
    t: "Bərpanın sübutu yoxdur",
    d: "Fayllar geri qaytarılır, amma orijinal olduğunu göstərən heç nə yoxdur. Bir baytın dəyişdiyini görmək üçün əvvəlcədən hesablanmış barmaq izi lazımdır.",
  },
];

const pillars = [
  {
    tag: "crypto",
    title: "Kriptoqrafiyanın əsasları",
    href: "/crypto",
    desc: "Hər alqoritm üçün kiçik interfeys var: nə yazsan, nəticəni görürsən.",
    points: ["AES-256-GCM", "SHA-256", "HMAC", "ECDSA P-256", "PBKDF2"],
  },
  {
    tag: "cloud",
    title: "Bulud təhlükəsizliyi",
    href: "/cloud",
    desc: "Bulud səviyyələri (IaaS/PaaS/SaaS), IAM siyasətləri və canlı yoxlama.",
    points: ["IaaS", "PaaS", "SaaS", "least privilege", "KMS"],
  },
  {
    tag: "isms",
    title: "İSMS (idarəetmə sistemləri)",
    href: "/isms",
    desc: "Risk qeydiyyatı, ISO 27001 nəzarətləri, insident planı və bərpa hədəfləri.",
    points: ["risk qeydiyyatı", "Annex A", "IR planı", "BCP/DRP", "RACI"],
  },
];

const controls = [
  "R2 və Supabase açarları yalnız server-side environment dəyişənlərində saxlanır",
  "R2 fayl oxuma/yazma və RDR operator endpoint-ləri ADMIN_TOKEN tələb edir",
  "R2 faylları 120 saniyəlik signed download URL ilə verilir",
  "R2 upload ölçüsü 4 MB ilə məhdudlaşdırılıb",
  "RDR baseline R2 ETag/ölçü/vaxt metadatasını müqayisə edir (maksimum 10,000 obyekt)",
  "R2 Queue hadisələri opsional Worker və ayrıca event token tələb edir",
  "RDR monitorinqi heç bir avtomatik bərpa və IAM dəyişikliyi etmir",
  "Domen skaneri qeyri-ictimai IP-ləri və hər redirect-i yoxlayır",
  "Audit zəncirinə yazma eyni vaxtlı sorğular üçün seriallaşdırılır",
  "Kripto laboratoriyası və vizual monitorinq demo/simulyasiyadır",
  "R2 bucket privacy və bucket-scoped token deploy zamanı qurulmalıdır",
  "ISO/IEC 27001 materialları sertifikat və uyğunluq bəyanı deyil",
];

const stack = [
  "Next.js 16",
  "React 19",
  "TypeScript",
  "Tailwind v4",
  "Web Crypto",
  "Cloudflare R2",
  "Supabase",
  "ISO 27001:2022",
  "GitHub Actions",
  "Vercel",
];

const levels = [
  { t: "IaaS", c: "EC2 · VPC · EBS", d: "Öz serverini idarə edirsən" },
  { t: "PaaS", c: "Vercel · Supabase", d: "Platforma provayderdə, tətbiq səndə" },
  { t: "SaaS", c: "GitHub", d: "Hazır servisdən istifadə edirik" },
];

function Label({ children }: { children: React.ReactNode }) {
  return <p className="mono text-xs text-accent">{children}</p>;
}

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="pointer-events-none absolute -right-40 -top-32 h-[640px] w-[640px] opacity-25">
          <div className="spin-slow absolute inset-0 rounded-full border border-accent/25" />
          <div className="spin-rev absolute inset-[16%] rounded-full border border-accent/20" />
          <div className="absolute inset-[34%] rounded-full border border-accent/15" />
          <div className="spin-slow absolute inset-0">
            <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-accent" />
            <span className="absolute bottom-6 right-10 h-1.5 w-1.5 rounded-full bg-accent-2" />
          </div>
        </div>

        <div className="relative mx-auto grid max-w-6xl gap-12 px-5 py-20 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="mono text-xs text-muted">
              bulud təhlükəsizliyi platforması
            </p>

            <h1 className="mt-4 text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl">
              Şifrələmə, bulud girişi və uyğunluq nəzarəti{" "}
              <span className="text-accent">bir tətbiqdə</span>.
            </h1>

            <p className="mt-5 max-w-xl text-muted">
              AegisCloud kripto laboratoriyasını, Cloudflare R2 üçün operator idarəli
              fayl saxlama və dəyişiklik monitorinqini, həmçinin ISO/IEC 27001
              mövzulu nümunə materialları birləşdirir. Kripto alətləri və bəzi
              vizuallar təhsil/demo üçündür; real faylları şifrələmir.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/crypto"
                className="mono rounded-sm bg-accent px-5 py-2.5 text-sm font-semibold text-[#0b0b0d] transition hover:bg-accent/90"
              >
                crypto --open
              </Link>
              <Link
                href="/cloud"
                className="mono rounded-sm border border-line px-5 py-2.5 text-sm text-muted transition hover:border-accent/50 hover:text-accent"
              >
                /cloud
              </Link>
            </div>
          </div>

          <Reveal>
            <HeroTerminal />
          </Reveal>
        </div>

        <div className="relative mx-auto max-w-6xl px-5 pb-10">
          <dl className="flex flex-wrap gap-x-12 gap-y-5 border-t border-line pt-6">
            {[
              { n: 5, s: "", l: "brauzer kripto aləti" },
              { n: 3, s: "", l: "təhsil modulu" },
              { n: 2, s: "", l: "R2 event tipi" },
              { n: 0, s: "", l: "avtomatik bərpa əməliyyatı" },
            ].map((x) => (
              <div key={x.l}>
                <dt className="mono text-2xl font-semibold text-accent">
                  <Counter to={x.n} suffix={x.s} />
                </dt>
                <dd className="mono mt-0.5 text-[11px] text-muted">{x.l}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <Marquee />

      {/* Threat model */}
      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-[260px_1fr]">
        <div className="self-start md:sticky md:top-24">
          <Reveal>
            <Label>{"// threat model"}</Label>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Bulud ransomware-i necə işləyir
            </h2>
            <p className="mt-2 text-sm text-muted">
              Kredensial oğurlananda hücum səssiz gedir. Sağda işin adi gedişi var.
            </p>
          </Reveal>
        </div>

        <div>
          {threats.map((t, i) => (
            <Reveal key={t.t} delay={i * 60}>
              <div className="group border-t border-line py-7 transition-colors hover:border-accent/40">
                <div className="flex gap-5">
                  <span className="mono text-2xl text-line transition-colors group-hover:text-accent">
                    0{i + 1}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold">{t.t}</h3>
                    <p className="mt-1.5 max-w-2xl text-sm text-muted">{t.d}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Modules */}
      <section className="border-y border-line bg-panel/30">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <Reveal>
            <Label>{"// modules"}</Label>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Modullar</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              Hər modul ayrıdır, amma bir-birinə bağlıdır. Kripto
              qatı saxlanan məlumatı qoruyur, bulud modulu girişi məhdudlaşdırır,
              İSMS isə ikisinin nəzarətini sənədləşdirir.
            </p>
          </Reveal>

          <div className="mt-8">
            {pillars.map((p, i) => (
              <Reveal key={p.title} delay={i * 70}>
                <div className="group grid gap-4 border-t border-line py-8 md:grid-cols-[90px_1fr_auto] md:items-start">
                  <span className="mono text-4xl text-line transition-colors group-hover:text-accent">
                    0{i + 1}
                  </span>
                  <div>
                    <div className="flex flex-wrap items-baseline gap-3">
                      <h3 className="text-xl font-semibold">{p.title}</h3>
                      <span className="mono text-[11px] text-accent-2">
                        [{p.tag}]
                      </span>
                    </div>
                    <p className="mt-2 max-w-2xl text-sm text-muted">{p.desc}</p>
                    <ul className="mono mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                      {p.points.map((pt) => (
                        <li key={pt}>{pt}</li>
                      ))}
                    </ul>
                  </div>
                  <Link
                    href={p.href}
                    className="mono text-sm text-accent opacity-60 transition-opacity group-hover:opacity-100"
                  >
                    {p.href} →
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Monitoring / radar */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 md:grid-cols-2">
        <Reveal>
          <Label>{"// monitoring"}</Label>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            Telemetriya və anomaliya
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Aşağıdakı radar yalnız animasiyalı illüstrasiyadır: burada agent,
            10 saniyəlik polling və ransomware aşkarlama backend-i qoşulmayıb.
            R2 dəyişiklik monitorinqi Cloud səhifəsində ayrıca qurulur.
          </p>
          <div className="mono mt-6 space-y-2 text-xs text-muted">
            <p>
              <span className="mr-2 text-accent-2">●</span>illüstrativ animasiya
            </p>
            <p>
              <span className="mr-2 text-accent">●</span>real agent qoşulmayıb
            </p>
            <p>
              <span className="mr-2 text-[#d97a5f]">●</span>canlı ölçmə yoxdur
            </p>
          </div>
        </Reveal>
        <Reveal>
          <ThreatRadar />
        </Reveal>
      </section>

      {/* Live connection */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <Reveal>
          <Label>{"// live"}</Label>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            Canlı bağlantı
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Server real şəbəkə çağırışları edir: işlədiyi region, bazadakı qeydlər
            və hər hansı domenin TLS sertifikatı ilə təhlükəsizlik başlıqları.
          </p>
        </Reveal>
        <Reveal className="mt-6">
          <LiveCheck />
        </Reveal>
      </section>

      {/* Merkle */}
      <section className="border-y border-line bg-panel/30">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <Reveal>
            <Label>{"// integrity"}</Label>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Merkle ağacı
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              Bu təhsil demosunda nümunə adın hash-i dəyişdirilir. Ağac real R2
              obyektlərini və ya fayl məzmununu izləməz.
            </p>
          </Reveal>
          <Reveal className="mt-6">
            <MerkleTree />
          </Reveal>
        </div>
      </section>

      {/* Lifecycle */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <Reveal>
          <Label>{"// lifecycle"}</Label>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            Müdafiə mərhələləri
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Hücumdan bərpaya qədər altı addım. Kartı seçəndə həmin addımın nə etdiyi
            sağda görünür.
          </p>
        </Reveal>
        <Reveal className="mt-6">
          <Lifecycle />
        </Reveal>
      </section>

      {/* Cloud spectrum */}
      <section className="border-y border-line bg-panel/30">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <Reveal>
            <Label>{"// cloud"}</Label>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Bulud xidmətləri hansı səviyyədə
            </h2>
          </Reveal>

          <div className="relative mt-12">
            <div className="absolute left-0 right-0 top-3 h-px bg-line" />
            <div className="grid gap-10 md:grid-cols-3">
              {levels.map((x, i) => (
                <Reveal key={x.t} delay={i * 90}>
                  <div className="relative">
                    <div className="flex items-center gap-3">
                      <span className="relative z-10 grid h-6 w-6 place-items-center rounded-full border border-accent/60 bg-background">
                        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                      </span>
                      <span className="mono text-lg text-accent">{x.t}</span>
                    </div>
                    <p className="mono mt-4 text-xs text-muted">{x.c}</p>
                    <p className="mt-2 max-w-xs text-sm text-muted">{x.d}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          <Reveal>
            <Link
              href="/cloud"
              className="mono mt-10 inline-block text-sm text-accent hover:underline"
            >
              /cloud
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Controls */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <Reveal>
          <Label>{"// controls"}</Label>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            Kodda olan funksiyalar və konfiqurasiya tələbləri
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Kodda həqiqətən işləyən funksiyaları Cloudflare, Vercel və Supabase-də ayrıca
            konfiqurasiya edilməli olan tələblərdən ayırırıq.
          </p>
        </Reveal>
        <ul className="mono mt-7 grid gap-x-10 sm:grid-cols-2">
          {controls.map((c, i) => (
            <Reveal key={c} as="li" delay={(i % 2) * 40}>
              <span className="flex gap-3 border-b border-line-soft py-2.5 text-[13px] text-muted">
                <span className="text-accent-2">+</span>
                {c}
              </span>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* Stack */}
      <section className="border-y border-line bg-panel/30">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <Reveal>
            <Label>{"// stack"}</Label>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              İstifadə olunan texnologiyalar
            </h2>
          </Reveal>
          <div className="mono mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
            {stack.map((t) => (
              <span key={t}>
                {t}
                <span className="ml-6 text-line">/</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-5 py-24 text-center">
        <Reveal>
          <h2 className="text-3xl font-semibold tracking-tight">
            Kripto laboratoriyasını brauzerdə sına
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted">
            Kripto alətləri brauzerin Web Crypto API-si ilə işləyən təhsil demosudur.
            R2, risk və audit funksiyaları operator tokeni və server konfiqurasiyası tələb edir.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/crypto"
              className="mono rounded-sm bg-accent px-5 py-2.5 text-sm font-semibold text-[#0b0b0d] transition hover:bg-accent/90"
            >
              crypto --open
            </Link>
            <Link
              href="/isms"
              className="mono rounded-sm border border-line px-5 py-2.5 text-sm text-muted transition hover:border-accent/50 hover:text-accent"
            >
              /isms
            </Link>
          </div>
          <div className="mx-auto mt-12 h-px w-24 bg-accent growline" />
        </Reveal>
      </section>
    </div>
  );
}
