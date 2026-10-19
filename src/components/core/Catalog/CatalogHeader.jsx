import { Link } from "react-router-dom"

import CategoryIcon from "../../common/CategoryIcon"

// Shows a skeleton while `loading`; with no category (e.g. not found) only the breadcrumb renders.
function CatalogHeader({ category, courseCount, loading = false }) {
  return (
    <section className="relative isolate">
      <div aria-hidden="true" className="notebook-grid absolute inset-0 -z-10" />
      <div className="mx-auto w-11/12 max-w-maxContent py-14 lg:py-16">
        <nav aria-label="Breadcrumb" className="text-sm text-content-muted">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link to="/" className="hover:text-content">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>Catalog</li>
            {category && (
              <>
                <li aria-hidden="true">/</li>
                <li aria-current="page" className="font-medium text-accent">
                  {category.name}
                </li>
              </>
            )}
          </ol>
        </nav>

        {category ? (
          <>
            <div className="mt-6 flex items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-selected text-2xl text-accent">
                <CategoryIcon name={category.name} />
              </span>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-content sm:text-4xl">{category.name}</h1>
                <p className="mt-1 text-sm text-content-muted">
                  {courseCount} {courseCount === 1 ? "course" : "courses"}
                </p>
              </div>
            </div>
            {category.description && (
              <p className="mt-5 max-w-3xl text-lg text-content-muted">{category.description}</p>
            )}
          </>
        ) : loading ? (
          <div aria-hidden="true" className="mt-6 flex items-center gap-4">
            <div className="h-14 w-14 animate-pulse rounded-2xl bg-line" />
            <div className="space-y-2">
              <div className="h-7 w-48 animate-pulse rounded bg-line" />
              <div className="h-4 w-20 animate-pulse rounded bg-line" />
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}

export default CatalogHeader
