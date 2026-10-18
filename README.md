# AegisCloud

AegisCloud Next.js təhsil/demo tətbiqidir. Cloud modulu Supabase Postgres-dən
audit/risk/RDR metadatası üçün, Cloudflare R2-dən isə obyekt saxlama üçün istifadə
edə bilər. Vercel tətbiqin deploy hədəfidir.

## Marşrutlar

| Marşrut | Təsvir |
|---|---|
| `/` | İcmal və demo vizuallar |
| `/crypto` | Brauzerdə Web Crypto laboratoriyası |
| `/cloud` | R2 faylları, RDR monitorinqi, icazə simulyatoru və domen skaneri |
| `/isms` | Nümunə risk qeydiyyatı, nəzarətlər və insident cavabı |
| `/team` | Nümunə komanda və layihə planı |

Animasiya, kripto iş axınları, icazə yoxlaması və ISO/BCP qeydlərinin bir
hissəsi təhsil nümunəsidir; canlı ransomware agenti, production fayl
şifrələməsi, uyğunluq attestatı və ya ISO sertifikatı deyil.

## İnteqrasiya və sərhədlər

- Faylları Cloudflare R2 bucket-də `uploads/` altında saxlayır, son 20 faylı
  göstərir və 120 saniyəlik imzalı endirmə URL-i yaradır.
- Server upload ölçüsünü 4 MB-la məhdudlaşdırır.
- Operator başladanda R2 obyekt siyahısını Supabase-də saxlanan baseline ilə
  müqayisə edir (maksimum 10,000 obyekt).
- İstəyə bağlı Cloudflare R2 event notifications → Queues → Worker yolu
  obyekt yaradılma/silinmə hadisələrini Supabase tarixçəsinə ötürür.
- Monitorinq yalnız dəyişiklikləri qeyd edir: obyektləri bərpa etmir və silmir,
  Cloudflare tokenlərini və icazələrini dəyişmir.

R2-də AWS S3 versiya tarixçəsi API-si yoxdur; müqayisə ETag, ölçü və
`LastModified` metadata-sından istifadə edir. ETag məzmunun kriptoqrafik hash
zəmanəti deyil (xüsusən multipart upload-larda), polling isə iki yoxlama
arasındakı müvəqqəti dəyişiklikləri qaçıra bilər. R2 Queue bildirişləri bu
boşluğu azaldır, amma özlüyündə ransomware aşkarlama və ya xəbərdarlıq xidməti
deyil. Hadisələr sübut deyil; operator nəticələri araşdırmalıdır.

## Qurulma

1. Supabase layihəsi yaradın və SQL Editor-də
   [`supabase/schema.sql`](./supabase/schema.sql) faylını icra edin. Skript
   mövcud audit qeydlərini silmir; köhnə `s3_*` RDR cədvəlləri varsa toxunulmaz
   saxlanır.
2. Cloudflare R2 bucket yaradın. Bucket-ə public access verməyin.
   R2 API token yaradarkən **Object Read & Write** seçib yalnız bu bucket-ə
   scope edin. R2 S3-compatible API Access Key ID və Secret Access Key-i istifadə edin.
3. `.env.example`-i `.env.local`-ə köçürüb Supabase və R2 dəyərlərini daxil edin.
   `ADMIN_TOKEN` və `RDR_EVENT_TOKEN` üçün ayrı, ən azı 32 simvolluq təsadüfi
   secret yaradın. `.env.local`-i commit etməyin.
4. Lokal yoxlama: `npm install`, `npm run dev`; sonra `/cloud` səhifəsində
   `ADMIN_TOKEN` daxil edib R2 storage və baseline funksiyalarını yoxlayın.
5. Vercel layihəsinə eyni server-side environment dəyişənlərini əlavə edib
   deploy edin. Heç bir secret-ə `NEXT_PUBLIC_` prefiksi verməyin.

R2 event notification qurulması üçün
[`docs/cloudflare-r2.md`](./docs/cloudflare-r2.md)-ə baxın. Bu ayrıca Cloudflare
Queue və Worker deploy-u tələb edir; bu hissə qurulmayıbsa manual
scan və upload/download yenə işləyir, event feed isə boş qalır.

## Environment dəyişənləri

Tətbiq üçün:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (və ya `SUPABASE_SECRET_KEY`)
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_R2_BUCKET`
- `CLOUDFLARE_R2_ACCESS_KEY_ID`
- `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
- `CLOUDFLARE_R2_JURISDICTION` (optional: `default`, `eu`, `fedramp`, or `us`)
- `ADMIN_TOKEN`
- `RDR_EVENT_TOKEN` (yalnız Queue Worker event forwarding üçün)

`ADMIN_TOKEN` multi-user login, MFA və ya istifadəçi əsaslı rol sistemi deyil,
ortaq operator secret-dir. Vercel-də **Project → Settings → Environment
Variables** bölməsində server-only dəyərləri əlavə edib redeploy edin.

## Lokal işə salma və build

Node.js `>=20.9.0` və npm tələb olunur.

```bash
npm install
npm run dev
npm run lint
npx tsc --noEmit
npm run build
```

`/api/risks`, `/api/audit`, `/api/scan`, `/api/storage` və `/api/rdr`
operator endpoint-ləri `x-admin-token` tələb edir. `/api/rdr/events` yalnız
`x-rdr-event-token` tələb edir; bu tokeni Cloudflare Worker secret kimi də
əlavə edin.

## Texnologiyalar

- Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4
- Cloudflare R2 (S3-compatible API; AWS SDK v3 client)
- Cloudflare Queues + Worker (opsional R2 event forwarding)
- Supabase Postgres (risk register, audit ledger, RDR baseline/event history)
- Web Crypto API (brauzer təhsil demosu)
- Vercel (deploy platforması)
