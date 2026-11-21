"use client";

import { PageHeader } from "@/components/ui/layout";
import { cn } from "@/lib/utils/text";
import type { ThemeMode } from "@/types/library";
import { useSettings } from "@/components/providers/settings-provider";

function SegmentButtons<T extends string>({
  options,
  value,
  onChange
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          aria-pressed={value === option.id}
          className={cn(
            "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
            value === option.id
              ? "border-strong bg-strong text-on-strong"
              : "border-border text-muted hover:border-strong hover:text-foreground"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function SwitchRow({
  label,
  help,
  checked,
  onChange
}: {
  label: string;
  help?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-4">
      <div className="min-w-0">
        <h3 className="text-sm font-medium text-foreground">{label}</h3>
        {help ? <p className="mt-0.5 text-xs text-muted">{help}</p> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-label={label}
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:transition-all after:bg-white",
          checked ? "bg-strong" : "bg-surface-soft"
        )}
      />
    </div>
  );
}

const THEME_OPTIONS: { id: ThemeMode; label: string }[] = [
  { id: "light", label: "Terang" },
  { id: "dark", label: "Gelap" },
  { id: "system", label: "Auto" }
];

const LANGUAGE_OPTIONS: { id: "id" | "en" | "ja"; label: string }[] = [
  { id: "id", label: "Indonesia" },
  { id: "en", label: "English" },
  { id: "ja", label: "日本語" }
];

const READER_OPTIONS: { id: "vertical" | "paged"; label: string }[] = [
  { id: "vertical", label: "Vertikal (scroll)" },
  { id: "paged", label: "Berhalaman" }
];

export default function SettingsPage() {
  const { theme, language, readerMode, dataSaver, reduceMotion, setTheme, update, reset } =
    useSettings();

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        eyebrow="Pengaturan"
        title="Pengaturan"
        description="Atur tampilan tempat menonton dan membaca sepanjang waktu."
      />

      <section className="space-y-6 rounded-lg border border-border bg-surface-soft/30 px-6 py-6">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Tema</h2>
          <p className="mt-1 text-xs text-muted">Pilih tampilan tempat penontonan Anda.</p>
          <div className="mt-3">
            <SegmentButtons options={THEME_OPTIONS} value={theme} onChange={setTheme} />
          </div>
        </div>
        <SwitchRow
          label="Pengembangan Data"
          help="Bolehkan pengurangan penggunaan data (jika sumber mendukung)."
          checked={dataSaver}
          onChange={(next) => update({ dataSaver: next })}
        />
        <SwitchRow
          label="Meringankan Gerak"
          help="Kurangi animasi sistem untuk kenyamanan visual."
          checked={reduceMotion}
          onChange={(next) => update({ reduceMotion: next })}
        />
      </section>

      <section className="space-y-6 rounded-lg border border-border bg-surface-soft/30 px-6 py-6">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Bahasa</h2>
          <p className="mt-1 text-xs text-muted">Bahasa aplikasi.</p>
          <div className="mt-3">
            <SegmentButtons options={LANGUAGE_OPTIONS} value={language} onChange={(id) => update({ language: id })} />
          </div>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">Mode reader</h2>
          <p className="mt-1 text-xs text-muted">Hanya berlaku untuk manga.</p>
          <div className="mt-3">
            <SegmentButtons options={READER_OPTIONS} value={readerMode} onChange={(id) => update({ readerMode: id })} />
          </div>
        </div>
      </section>

      <div>
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-4 text-sm font-medium text-muted transition-colors hover:border-strong hover:text-foreground"
        >
          Atur ulang pengaturan
        </button>
      </div>
    </div>
  );
}
