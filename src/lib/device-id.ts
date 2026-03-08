export const DEVICE_ID_STORAGE_KEY = "retomemorial_device_fingerprint_v1";

function fnv1a32(input: string) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function buildDeviceSeed() {
  if (typeof window === "undefined") return "server";

  const nav = navigator as Navigator & {
    deviceMemory?: number;
  };
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
  const width = Math.max(window.screen?.width ?? 0, window.screen?.height ?? 0);
  const height = Math.min(window.screen?.width ?? 0, window.screen?.height ?? 0);

  return [
    nav.userAgent ?? "",
    nav.language ?? "",
    Array.isArray(nav.languages) ? nav.languages.join(",") : "",
    nav.platform ?? "",
    String(nav.hardwareConcurrency ?? ""),
    String(nav.deviceMemory ?? ""),
    String(nav.maxTouchPoints ?? ""),
    `${width}x${height}`,
    String(window.screen?.colorDepth ?? ""),
    String(window.devicePixelRatio ?? ""),
    tz,
  ].join("|");
}

async function hashSeed(seed: string) {
  if (typeof window !== "undefined" && window.crypto?.subtle) {
    const encoded = new TextEncoder().encode(seed);
    const digest = await window.crypto.subtle.digest("SHA-256", encoded);
    return Array.from(new Uint8Array(digest))
      .map((value) => value.toString(16).padStart(2, "0"))
      .join("");
  }

  return `${fnv1a32(seed)}${fnv1a32(`${seed}:retomemorial`)}`;
}

export async function getOrCreateDeviceId() {
  if (typeof window === "undefined") return null;
  const existing = window.localStorage.getItem(DEVICE_ID_STORAGE_KEY);
  if (existing && existing.length >= 16) return existing;

  const seed = buildDeviceSeed();
  const digest = await hashSeed(seed);
  const deviceId = `fp_${digest}`;
  window.localStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
  return deviceId;
}
