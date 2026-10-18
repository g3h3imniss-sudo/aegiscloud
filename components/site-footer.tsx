import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="mono flex items-center gap-2 text-sm">
            <span className="text-accent">~/</span>
            <span className="font-semibold">aegiscloud</span>
          </div>
          <p className="mt-3 max-w-sm text-sm text-muted">
            Bulud təhlükəsizliyi, kriptoqrafiya və informasiya təhlükəsizliyi
            idarəetmə sistemlərini bir yerdə saxlayan platforma.
          </p>
        </div>

        <div className="mono text-xs">
          <p className="text-muted">modullar</p>
          <ul className="mt-3 space-y-2">
            <li><Link className="text-muted hover:text-accent" href="/crypto">crypto</Link></li>
            <li><Link className="text-muted hover:text-accent" href="/cloud">cloud</Link></li>
            <li><Link className="text-muted hover:text-accent" href="/isms">isms</Link></li>
          </ul>
        </div>

        <div className="mono text-xs">
          <p className="text-muted">layihə</p>
          <ul className="mt-3 space-y-2">
            <li><Link className="text-muted hover:text-accent" href="/team">team</Link></li>
            <li><Link className="text-muted hover:text-accent" href="/isms">isms</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line-soft">
        <p className="mono mx-auto max-w-6xl px-5 py-5 text-[11px] text-muted">
          © 2026 aegiscloud. Bütün kriptoqrafik əməliyyatlar brauzerdə, Web Crypto
          API ilə yerinə yetirilir.
        </p>
      </div>
    </footer>
  );
}
