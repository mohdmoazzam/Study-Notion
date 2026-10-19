const STATS = [
  { value: "5K+", label: "Active students" },
  { value: "10+", label: "Expert mentors" },
  { value: "200+", label: "Courses" },
  { value: "50+", label: "Awards" },
]

function StatsBand() {
  return (
    <section className="border-y border-line bg-surface">
      <dl className="mx-auto grid w-11/12 max-w-maxContent grid-cols-2 gap-8 py-14 text-center md:grid-cols-4">
        {STATS.map(({ value, label }) => (
          <div key={label} className="flex flex-col-reverse gap-1">
            <dt className="text-sm text-content-muted">{label}</dt>
            <dd className="text-4xl font-bold tracking-tight text-content">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

export default StatsBand
