import { z } from "zod";
import { USER_AGENT, env } from "./env";
import { SourceError, isAbortError } from "./errors";

interface RequestOptions {
  source: string;
  timeoutMs?: number;
  retries?: number;
  headers?: Record<string, string>;
  method?: "GET" | "POST";
  body?: string;
  accept?: string;
}

const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function request(url: string, options: RequestOptions): Promise<Response> {
  const { source, timeoutMs = env.SOURCE_TIMEOUT_MS, retries = 2, headers = {}, method = "GET", body } = options;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method,
        body,
        headers: {
          "User-Agent": USER_AGENT,
          Accept: options.accept ?? "application/json, text/plain, */*",
          "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
          ...headers
        },
        cache: "no-store",
        signal: controller.signal,
        redirect: "follow"
      });

      if (response.ok) return response;

      if (RETRYABLE_STATUS.has(response.status) && attempt < retries) {
        lastError = new SourceError(source, `Sumber mengembalikan status ${response.status}.`, {
          status: response.status,
          code: "http"
        });
        await sleep(350 * 2 ** attempt);
        continue;
      }

      throw new SourceError(source, `Sumber mengembalikan status ${response.status}.`, {
        status: response.status,
        code: response.status === 404 ? "not_found" : "http"
      });
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "digest" in error &&
        typeof (error as { digest?: unknown }).digest === "string" &&
        ((error as { digest: string }).digest === "DYNAMIC_SERVER_USAGE" ||
          (error as { digest: string }).digest.startsWith("NEXT_"))
      ) {
        throw error;
      }

      if (error instanceof SourceError) {
        if (attempt >= retries || !RETRYABLE_STATUS.has(error.status ?? 0)) throw error;
        lastError = error;
        await sleep(350 * 2 ** attempt);
        continue;
      }

      if (isAbortError(error)) {
        lastError = new SourceError(source, "Permintaan ke sumber melewati batas waktu.", {
          code: "timeout",
          cause: error
        });
      } else {
        lastError = new SourceError(source, "Tidak dapat menghubungi sumber.", { code: "network", cause: error });
      }

      if (attempt < retries) {
        await sleep(350 * 2 ** attempt);
        continue;
      }
      throw lastError;
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError instanceof SourceError
    ? lastError
    : new SourceError(source, "Permintaan ke sumber gagal.", { code: "unknown", cause: lastError });
}

export async function fetchJson<T>(
  url: string,
  schema: z.ZodType<T>,
  options: RequestOptions
): Promise<T> {
  const response = await request(url, options);
  const raw: unknown = await response.json().catch((error: unknown) => {
    throw new SourceError(options.source, "Respons sumber bukan JSON yang valid.", {
      code: "validation",
      cause: error
    });
  });

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new SourceError(options.source, "Format respons sumber tidak sesuai.", {
      code: "validation",
      cause: parsed.error
    });
  }
  return parsed.data;
}

export async function fetchText(url: string, options: RequestOptions): Promise<string> {
  const response = await request(url, { ...options, accept: "text/html,application/xhtml+xml" });
  return response.text();
}
