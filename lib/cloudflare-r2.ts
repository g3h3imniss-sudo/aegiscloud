import {
  S3Client,
} from "@aws-sdk/client-s3";

let client: S3Client | null = null;

export function getR2Config() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const bucket = process.env.CLOUDFLARE_R2_BUCKET;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  const jurisdiction = process.env.CLOUDFLARE_R2_JURISDICTION || "default";
  const endpointSuffixes: Record<string, string> = {
    default: "",
    eu: ".eu",
    fedramp: ".fedramp",
    us: ".us",
  };

  if (
    !accountId ||
    !/^[a-f0-9]{32}$/i.test(accountId) ||
    !bucket ||
    !accessKeyId ||
    !secretAccessKey ||
    !(jurisdiction in endpointSuffixes)
  ) {
    return null;
  }
  return {
    accountId,
    endpoint: `https://${accountId}${endpointSuffixes[jurisdiction]}.r2.cloudflarestorage.com`,
    bucket,
    accessKeyId,
    secretAccessKey,
  };
}

export function getR2Client(): S3Client | null {
  const config = getR2Config();
  if (!config) return null;
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }
  return client;
}

export function r2Bucket(): string | null {
  return getR2Config()?.bucket ?? null;
}
