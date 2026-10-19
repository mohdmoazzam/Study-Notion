// `as` lets a page use this for its main heading (h1) while sections keep h2.
function SectionHeading({ eyebrow, title, subtitle, as: Heading = "h2" }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      {eyebrow && (
        <p className="text-sm font-semibold uppercase tracking-wider text-accent">{eyebrow}</p>
      )}
      <Heading className="mt-2 text-3xl font-bold tracking-tight text-content sm:text-4xl">{title}</Heading>
      {subtitle && <p className="mt-4 text-lg text-content-muted">{subtitle}</p>}
    </div>
  )
}

export default SectionHeading
