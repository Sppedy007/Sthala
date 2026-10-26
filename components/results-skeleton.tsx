export function ResultsSkeleton() {
  const block = "shimmer rounded-3xl border border-white/10"
  return (
    <div aria-hidden="true" className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div className={`${block} h-64 md:col-span-2`} />
      <div className={`${block} h-64`} />
      <div className={`${block} h-64`} />
      <div className={`${block} h-48 md:col-span-2 lg:col-span-4`} />
      <div className={`${block} h-80 md:col-span-2 lg:col-span-4`} />
    </div>
  )
}
