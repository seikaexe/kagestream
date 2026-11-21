export class SourceError extends Error {
  readonly source: string;
  readonly status?: number;
  readonly code: "timeout" | "network" | "http" | "validation" | "not_found" | "unknown";

  constructor(
    source: string,
    message: string,
    options: { status?: number; code?: SourceError["code"]; cause?: unknown } = {}
  ) {
    super(message, { cause: options.cause });
    this.name = "SourceError";
    this.source = source;
    this.status = options.status;
    this.code = options.code ?? "unknown";
  }
}

export function errorMessage(error: unknown): string {
  if (error instanceof SourceError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return "Terjadi kesalahan yang tidak diketahui.";
}

export function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === "AbortError") ||
    (error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError"))
  );
}
