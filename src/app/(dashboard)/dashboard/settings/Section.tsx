export default function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">{title}</h2>
        {hint && <p className="text-xs text-[var(--text-muted)] md:max-w-sm md:text-right">{hint}</p>}
      </div>
      {children}
    </section>
  )
}
