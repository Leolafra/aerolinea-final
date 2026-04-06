const API_URL =
  import.meta.env.VITE_API_URL ??
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:4000/api"
    : "https://aerolinea-final.onrender.com/api");
const cache = new Map<string, { expiresAt: number; value: unknown }>();

function invalidateCache(pathPrefix?: string) {
  if (!pathPrefix) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.includes(pathPrefix)) {
      cache.delete(key);
    }
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Tiempo de espera agotado.")), timeoutMs);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

async function request<T>(path: string, options?: RequestInit & { retries?: number; timeoutMs?: number; cacheMs?: number }): Promise<T> {
  const method = options?.method ?? "GET";
  const cacheKey = `${method}:${path}`;

  if (method === "GET" && options?.cacheMs) {
    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value as T;
    }
  }

  const retries = options?.retries ?? 1;
  const timeoutMs = options?.timeoutMs ?? 9000;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await withTimeout(
        fetch(`${API_URL}${path}`, {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...(options?.headers ?? {}),
          },
          ...options,
        }),
        timeoutMs,
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Fallo del sistema." }));
        throw new Error(error.message ?? "Fallo del sistema.");
      }

      const value = (await response.json()) as T;
      if (method === "GET" && options?.cacheMs) {
        cache.set(cacheKey, { expiresAt: Date.now() + options.cacheMs, value });
      }
      if (method !== "GET") {
        invalidateCache();
      }
      return value;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Fallo del sistema.");
    }
  }

  throw lastError ?? new Error("Fallo del sistema.");
}

export const api = {
  get: <T,>(path: string, options?: { cacheMs?: number; retries?: number; timeoutMs?: number }) => request<T>(path, options),
  post: <T,>(path: string, body: unknown) =>
    request<T>(path, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  patch: <T,>(path: string, body: unknown) =>
    request<T>(path, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  clearCache: () => cache.clear(),
  invalidateCache,
};
