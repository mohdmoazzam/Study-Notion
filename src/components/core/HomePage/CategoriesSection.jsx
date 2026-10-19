import { useEffect, useState } from "react"
import { FaArrowRight } from "react-icons/fa"
import { Link } from "react-router-dom"

import { apiConnector } from "../../../services/apiconnector"
import { categories } from "../../../services/apis"
import { toCatalogSlug } from "../../../utils/catalog"
import CategoryIcon from "../../common/CategoryIcon"
import SectionHeading from "./SectionHeading"

function CategoriesSection() {
  const [items, setItems] = useState([])

  useEffect(() => {
    let active = true
    apiConnector("GET", categories.CATEGORIES_API)
      .then((res) => {
        if (active) setItems(res?.data?.data ?? [])
      })
      .catch((error) => console.log("Could not fetch categories.", error))
    return () => {
      active = false
    }
  }, [])

  if (items.length === 0) return null

  return (
    <section className="border-y border-line bg-surface py-20">
      <div className="mx-auto w-11/12 max-w-maxContent">
        <SectionHeading
          eyebrow="Explore"
          title="Browse by category"
          subtitle="Find the right course for where you want to go next."
        />

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((category) => (
            <Link
              key={category._id}
              to={`/catalog/${toCatalogSlug(category.name)}`}
              className="group flex items-center justify-between gap-4 rounded-xl border border-line bg-page p-5 transition hover:border-brand hover:shadow-md"
            >
              <div className="flex min-w-0 items-center gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-selected text-lg text-accent">
                  <CategoryIcon name={category.name} />
                </span>
                <div className="min-w-0">
                  <h3 className="font-semibold text-content">{category.name}</h3>
                  <p className="mt-1 overflow-hidden text-sm text-content-muted [-webkit-box-orient:vertical] [-webkit-line-clamp:2] [display:-webkit-box]">
                    {category.description}
                  </p>
                </div>
              </div>
              <FaArrowRight className="shrink-0 text-content-subtle transition group-hover:translate-x-1 group-hover:text-accent" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export default CategoriesSection
