import { useEffect, useMemo, useState } from "react"
import { FaArrowRight } from "react-icons/fa"
import { FiBookOpen } from "react-icons/fi"
import { Link, useParams } from "react-router-dom"

import Footer from "../components/common/Footer"
import LinkButton from "../components/common/LinkButton"
import CatalogHeader from "../components/core/Catalog/CatalogHeader"
import CourseCard, { CourseCardSkeleton } from "../components/core/Catalog/CourseCard"
import { apiConnector } from "../services/apiconnector"
import { categories } from "../services/apis"
import { getCatalogPageData } from "../services/operations/pageAndComponentData"
import { toCatalogSlug } from "../utils/catalog"
import { getCreatedAt } from "../utils/dateFormatter"

const SORTS = [
  {
    id: "popular",
    label: "Most popular",
    compare: (a, b) => (b.studentsEnrolled?.length ?? 0) - (a.studentsEnrolled?.length ?? 0),
  },
  {
    id: "newest",
    label: "Newest",
    compare: (a, b) => (getCreatedAt(b)?.getTime() ?? 0) - (getCreatedAt(a)?.getTime() ?? 0),
  },
]

const byPopularity = SORTS[0].compare

function CourseSection({ title, subtitle, action, children }) {
  return (
    <section className="mx-auto w-11/12 max-w-maxContent py-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-content sm:text-3xl">{title}</h2>
          {subtitle && <p className="mt-1 text-content-muted">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

function CourseGrid({ courses, columns = "sm:grid-cols-2 lg:grid-cols-3" }) {
  return (
    <div className={`grid gap-6 ${columns}`}>
      {courses.map((course) => (
        <CourseCard key={course._id} course={course} />
      ))}
    </div>
  )
}

function EmptyState({ title, message }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-14 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-selected text-xl text-accent">
        <FiBookOpen aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-lg font-semibold text-content">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-content-muted">{message}</p>
      <div className="mt-6">
        <LinkButton to="/" variant="secondary">
          Explore other categories
        </LinkButton>
      </div>
    </div>
  )
}

function Catalog() {
  const { catalogName } = useParams()
  // "loading" | "ready" | "notFound" | "error"
  const [status, setStatus] = useState("loading")
  const [pageData, setPageData] = useState(null)
  const [sortId, setSortId] = useState(SORTS[0].id)

  useEffect(() => {
    let active = true
    setStatus("loading")
    setPageData(null)

    ;(async () => {
      try {
        const res = await apiConnector("GET", categories.CATEGORIES_API)
        const category = res?.data?.data?.find((ct) => toCatalogSlug(ct.name) === catalogName)
        if (!category) {
          if (active) setStatus("notFound")
          return
        }
        const result = await getCatalogPageData(category._id)
        if (!active) return
        if (result?.success) {
          setPageData(result.data)
          setStatus("ready")
        } else {
          setStatus("error")
        }
      } catch (error) {
        console.log("Could not load catalog.", error)
        if (active) setStatus("error")
      }
    })()

    return () => {
      active = false
    }
  }, [catalogName])

  const category = pageData?.selectedCategory
  const courses = useMemo(() => {
    const sort = SORTS.find((s) => s.id === sortId) ?? SORTS[0]
    return [...(category?.course ?? [])].sort(sort.compare)
  }, [category, sortId])

  const otherCategory = pageData?.differentCategory
  const otherCourses = [...(otherCategory?.course ?? [])].sort(byPopularity).slice(0, 3)
  const popularCourses = (pageData?.mostSellingCourses ?? []).slice(0, 4)

  if (status === "notFound" || status === "error") {
    return (
      <div className="bg-page">
        <CatalogHeader category={null} />
        <div className="mx-auto w-11/12 max-w-maxContent py-12">
          <EmptyState
            title={status === "notFound" ? "Category not found" : "Something went wrong"}
            message={
              status === "notFound"
                ? "We couldn't find this category. It may have been renamed or removed."
                : "We couldn't load this category right now. Please try again in a moment."
            }
          />
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="bg-page">
      <CatalogHeader category={category} courseCount={courses.length} loading={status === "loading"} />

      <CourseSection
        title="Courses to get you started"
        subtitle={category ? `Hand-picked courses in ${category.name}` : undefined}
        action={
          courses.length > 1 && (
            <div role="group" aria-label="Sort courses" className="flex rounded-xl border border-line bg-surface p-1">
              {SORTS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={sortId === id}
                  onClick={() => setSortId(id)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                    sortId === id ? "bg-brand text-on-brand" : "text-content-muted hover:text-content"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )
        }
      >
        {status === "loading" ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <CourseCardSkeleton key={i} />
            ))}
          </div>
        ) : courses.length > 0 ? (
          <CourseGrid courses={courses} />
        ) : (
          <EmptyState
            title="No courses yet"
            message="Courses in this category are on their way. Check back soon, or explore other categories in the meantime."
          />
        )}
      </CourseSection>

      {otherCategory && otherCourses.length > 0 && (
        <CourseSection
          title={`Top courses in ${otherCategory.name}`}
          action={
            <Link
              to={`/catalog/${toCatalogSlug(otherCategory.name)}`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline"
            >
              View all <FaArrowRight aria-hidden="true" />
            </Link>
          }
        >
          <CourseGrid courses={otherCourses} />
        </CourseSection>
      )}

      {popularCourses.length > 0 && (
        <CourseSection title="Most popular on StudyNotion" subtitle="What other learners are enrolling in">
          <CourseGrid courses={popularCourses} columns="sm:grid-cols-2 lg:grid-cols-4" />
        </CourseSection>
      )}

      <div className="pb-8" />
      <Footer />
    </div>
  )
}

export default Catalog
