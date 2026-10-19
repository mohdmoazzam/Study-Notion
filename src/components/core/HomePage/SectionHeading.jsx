function SectionHeading({ eyebrow, title, subtitle }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      {eyebrow && (
        <p className="text-sm font-semibold uppercase tracking-wider text-accent">{eyebrow}</p>
      )}
      <h2 className="mt-2 text-3xl font-bold tracking-tight text-content sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-4 text-lg text-content-muted">{subtitle}</p>}
    </div>
  )
}

export default SectionHeading
