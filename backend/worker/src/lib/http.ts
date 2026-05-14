// Téléchargement HTTP basique pour récupérer médias depuis les CDNs Insta/TikTok.
export async function downloadAsBuffer(url: string, maxBytes = 50 * 1024 * 1024): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} on ${url}`);
  }
  const len = res.headers.get("content-length");
  if (len && parseInt(len, 10) > maxBytes) {
    throw new Error(`File too large (${len} bytes, max ${maxBytes})`);
  }
  const ab = await res.arrayBuffer();
  if (ab.byteLength > maxBytes) {
    throw new Error(`File too large (${ab.byteLength} bytes, max ${maxBytes})`);
  }
  return Buffer.from(ab);
}
