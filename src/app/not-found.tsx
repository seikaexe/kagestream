import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">404</h1>
      <p className="text-sm text-muted">Halaman yang Anda cari tidak ditemukan.</p>
      <Link
        href="/"
        className="inline-flex h-9 items-center gap-2 rounded-md bg-strong px-4 text-sm font-medium text-on-strong transition-opacity hover:opacity-85"
      >
        Kembali ke home
      </Link>
    </div>
  );
}
