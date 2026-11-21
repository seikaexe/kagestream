"use client";

export default function ErrorPage({
  error,
  reset
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 text-center">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">Terjadi kesalahan</h1>
      <p className="max-w-md text-sm text-muted">{error.message || "Sebuah kesalahan tidak terduga terjadi. Coba muat ulang halaman."}</p>
      <button
        type="button"
        onClick={() => reset()}
        className="inline-flex h-10 items-center gap-2 rounded-md bg-strong px-4 text-sm font-medium text-on-strong transition-opacity hover:opacity-85"
      >
        Coba lagi
      </button>
    </div>
  );
}
