/**
 * Minimal Cloudflare R2 client using fetch + AWS Signature V4.
 * We avoid pulling the heavy aws-sdk to keep cold-start small on Vercel.
 *
 * Required env:
 * - R2_ACCOUNT_ID
 * - R2_ACCESS_KEY_ID
 * - R2_SECRET_ACCESS_KEY
 * - R2_BUCKET
 */

import { createHash, createHmac } from "node:crypto";

type SigningKeys = {
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  endpoint: string;
};

function getKeys(): SigningKeys {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error("R2 environment variables are not fully configured.");
  }
  return {
    accessKeyId,
    secretAccessKey,
    bucket,
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  };
}

function sha256Hex(input: Buffer | string): string {
  return createHash("sha256").update(input).digest("hex");
}

function hmac(key: Buffer | string, data: string): Buffer {
  return createHmac("sha256", key).update(data).digest();
}

function signingKey(secret: string, date: string, region: string, service: string): Buffer {
  const kDate = hmac("AWS4" + secret, date);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  return hmac(kService, "aws4_request");
}

type PutOpts = {
  key: string;
  body: Buffer;
  contentType?: string;
};

export async function putObject({ key, body, contentType }: PutOpts): Promise<void> {
  const { accessKeyId, secretAccessKey, bucket, endpoint } = getKeys();
  const region = "auto";
  const service = "s3";
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const host = new URL(endpoint).host;
  const canonicalUri = `/${bucket}/${encodeURI(key)}`;
  const payloadHash = sha256Hex(body);
  const headers: Record<string, string> = {
    host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  };
  if (contentType) headers["content-type"] = contentType;

  const sortedHeaderNames = Object.keys(headers).sort();
  const canonicalHeaders =
    sortedHeaderNames.map((h) => `${h}:${headers[h]}\n`).join("") + "";
  const signedHeaders = sortedHeaderNames.join(";");
  const canonicalRequest = [
    "PUT",
    canonicalUri,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join("\n");

  const key2 = signingKey(secretAccessKey, dateStamp, region, service);
  const signature = createHmac("sha256", key2)
    .update(stringToSign)
    .digest("hex");

  const authorization = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const res = await fetch(`${endpoint}${canonicalUri}`, {
    method: "PUT",
    headers: { ...headers, authorization },
    body: body as unknown as BodyInit,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`R2 putObject failed ${res.status}: ${text}`);
  }
}

export function buildStorageKey(parts: {
  scope: "articles" | "drafts" | "exports";
  id: string | number;
  filename: string;
}): string {
  const safe = parts.filename.replace(/[^a-zA-Z0-9._-]+/g, "_");
  return `${parts.scope}/${parts.id}/${Date.now()}-${safe}`;
}
