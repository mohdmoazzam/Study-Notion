import copy from "copy-to-clipboard"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { FaStar } from "react-icons/fa"
import {
  FiArrowRight,
  FiCalendar,
  FiClock,
  FiGlobe,
  FiLayers,
  FiPlayCircle,
  FiShoppingCart,
  FiStar,
  FiTarget,
  FiUser,
  FiUsers,
} from "react-icons/fi"
import { useDispatch, useSelector } from "react-redux"
import { Link, useNavigate, useParams } from "react-router-dom"

import CategoryIcon from "../components/common/CategoryIcon"
import ConfirmationModal from "../components/common/ConfirmationModal"
import Footer from "../components/common/Footer"
import LinkButton from "../components/common/LinkButton"
import CourseContent from "../components/core/course/CourseContent"
import CourseGlance from "../components/core/course/CourseGlance"
import InstructorCard from "../components/core/course/InstructorCard"
import CoursePurchaseCard, { primaryButton } from "../components/core/course/CoursePurchaseCard"
import CourseReviews from "../components/core/course/CourseReviews"
import LearningOutcomes, { parseOutcomes } from "../components/core/course/LearningOutcomes"
import { fetchCourseDetails } from "../services/operations/courseDetailsAPI"
import { buyCourse } from "../services/operations/studentFeaturesAPI"
import { addToCart } from "../slices/cartSlice"
import GetAvgRating from "../utils/avgRating"
import { toCatalogSlug } from "../utils/catalog"
import { ACCOUNT_TYPE } from "../utils/constants"
import { formattedDate, getCreatedAt } from "../utils/dateFormatter"
import { formatPrice } from "../utils/formatPrice"

const avatarFor = (person) =>
  person?.image ||
  `https://api.dicebear.com/5.x/initials/svg?seed=${encodeURIComponent(`${person?.firstName ?? ""} ${person?.lastName ?? ""}`)}`

function Section({ id, title, subtitle, Icon, children }) {
  return (
    <section id={id} className="scroll-mt-6">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-selected text-lg text-accent">
          <Icon aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-content">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-content-muted">{subtitle}</p>}
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  )
}

function MetaPill({ Icon, children }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/90 px-3.5 py-1.5 text-sm text-content-muted shadow-sm">
      {Icon && <Icon aria-hidden="true" className="text-accent" />}
      {children}
    </span>
  )
}

function CourseDetailsSkeleton() {
  return (
    <div aria-hidden="true" className="mx-auto grid w-11/12 max-w-maxContent gap-10 py-16 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <div className="h-7 w-32 animate-pulse rounded-full bg-line" />
        <div className="h-12 w-3/4 animate-pulse rounded bg-line" />
        <div className="h-5 w-full animate-pulse rounded bg-line" />
        <div className="h-5 w-2/3 animate-pulse rounded bg-line" />
      </div>
      <div className="h-96 animate-pulse rounded-2xl bg-line" />
    </div>
  )
}

export const CourseDetails = () => {
  const { user } = useSelector((state) => state.profile)
  const { token } = useSelector((state) => state.auth)
  const { paymentLoading } = useSelector((state) => state.course)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { courseId } = useParams()

  // "loading" | "ready" | "error"
  const [status, setStatus] = useState("loading")
  const [details, setDetails] = useState(null)
  const [confirmationModal, setConfirmationModal] = useState(null)
  const [activeSectionId, setActiveSectionId] = useState(null)

  useEffect(() => {
    let active = true
    setStatus("loading")
    fetchCourseDetails(courseId)
      .then((result) => {
        if (!active) return
        if (result?.success) {
          setDetails(result.data)
          setStatus("ready")
        } else {
          setStatus("error")
        }
      })
      .catch(() => active && setStatus("error"))
    return () => {
      active = false
    }
  }, [courseId])

  // Highlight the "On this page" entry for the section currently near the top of the screen.
  useEffect(() => {
    if (status !== "ready") return undefined
    const sectionElements = [...document.querySelectorAll("section[id^='course-']")]
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting)
        if (visible.length) setActiveSectionId(visible[0].target.id)
      },
      { rootMargin: "-15% 0px -70% 0px" }
    )
    sectionElements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [status])

  const course = details?.courseDetails

  // Buying and the cart are for logged-in students only.
  const canPurchase = (action) => {
    if (!token) {
      setConfirmationModal({
        text1: "You are not logged in!",
        text2: `Please log in to ${action}.`,
        btn1Text: "Log in",
        btn2Text: "Cancel",
        btn1Handler: () => navigate("/login"),
        btn2Handler: () => setConfirmationModal(null),
      })
      return false
    }
    if (user?.accountType === ACCOUNT_TYPE.INSTRUCTOR) {
      toast.error("You are an Instructor. You can't buy a course.")
      return false
    }
    return true
  }

  const handleBuyCourse = () => {
    if (canPurchase("purchase this course")) buyCourse(token, [courseId], user, navigate, dispatch)
  }

  const handleAddToCart = () => {
    if (canPurchase("add courses to your cart")) dispatch(addToCart(course))
  }

  const handleShare = () => {
    copy(window.location.href)
    toast.success("Link copied to clipboard")
  }

  const goToCourse = () => navigate("/dashboard/enrolled-courses")

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
    setActiveSectionId(id)
  }

  if (status === "loading") {
    return (
      <div className="bg-page">
        <CourseDetailsSkeleton />
      </div>
    )
  }

  if (status === "error" || !course) {
    return (
      <div className="bg-page">
        <div className="mx-auto w-11/12 max-w-maxContent py-24 text-center">
          <h1 className="text-3xl font-bold text-content">Course not found</h1>
          <p className="mx-auto mt-3 max-w-md text-content-muted">
            This course may have been removed or is no longer available.
          </p>
          <div className="mt-8">
            <LinkButton to="/">Back to home</LinkButton>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const reviews = course.ratingAndReviews ?? []
  const averageRating = reviews.length ? GetAvgRating(reviews) : 0
  const sections = course.courseContent ?? []
  const lectureCount = sections.reduce((count, section) => count + (section.subSection?.length ?? 0), 0)
  const studentCount = course.studentsEnrolled?.length ?? 0
  const instructor = course.instructor
  const instructorName = [instructor?.firstName, instructor?.lastName].filter(Boolean).join(" ")
  const createdOn = formattedDate(getCreatedAt(course))
  // Courses created before the language field existed default to English.
  const courseLanguage = course.language || "English"
  const isEnrolled = Boolean(user && course.studentsEnrolled?.includes(user._id))
  const requirements = (course.instructions ?? []).filter((item) => item?.trim())
  const outcomeCount = parseOutcomes(course.whatYouWillLearn).length

  const glanceStats = [
    { Icon: FiLayers, label: "Sections", value: sections.length },
    { Icon: FiPlayCircle, label: "Lectures", value: lectureCount },
    { Icon: FiClock, label: "Total length", value: details.totalDuration },
    { Icon: FiUsers, label: "Students", value: studentCount },
    { Icon: FiGlobe, label: "Language", value: courseLanguage },
    createdOn && { Icon: FiCalendar, label: "Created", value: createdOn },
  ].filter(Boolean)

  const navItems = [
    (outcomeCount > 0 || requirements.length > 0) && { id: "course-outcomes", label: "What you'll learn" },
    { id: "course-content", label: "Course content" },
    instructor && { id: "course-instructor", label: "Instructor" },
    { id: "course-reviews", label: "Reviews" },
  ].filter(Boolean)

  return (
    <div className="bg-page">
      {/* Hero */}
      <section className="relative isolate border-b border-line">
        <div aria-hidden="true" className="notebook-grid absolute inset-0 -z-10" />
        <div className="mx-auto grid w-11/12 max-w-maxContent items-start gap-10 py-12 lg:grid-cols-3 lg:py-16">
          <div className="lg:col-span-2">
            <nav aria-label="Breadcrumb" className="text-sm text-content-muted">
              <ol className="flex flex-wrap items-center gap-1.5">
                <li>
                  <Link to="/" className="hover:text-content">
                    Home
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li aria-current="page" className="max-w-[16rem] truncate">
                  {course.courseName}
                </li>
              </ol>
            </nav>

            {course.category?.name && (
              <Link
                to={`/catalog/${toCatalogSlug(course.category.name)}`}
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-brand/50 bg-surface px-4 py-1.5 text-sm font-semibold text-accent shadow-sm transition hover:border-brand"
              >
                <CategoryIcon name={course.category.name} />
                {course.category.name}
              </Link>
            )}

            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-content sm:text-5xl">
              {course.courseName}
            </h1>
            {course.courseDescription && (
              <p className="mt-4 max-w-2xl text-lg text-content-muted">{course.courseDescription}</p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              {reviews.length > 0 ? (
                <MetaPill>
                  <FaStar aria-hidden="true" className="text-brand" />
                  <span className="font-bold text-content">{averageRating.toFixed(1)}</span>
                  <span>
                    ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
                  </span>
                </MetaPill>
              ) : (
                <MetaPill Icon={FiStar}>New course</MetaPill>
              )}
              <MetaPill Icon={FiUsers}>
                {studentCount} {studentCount === 1 ? "student" : "students"}
              </MetaPill>
              {details.totalDuration && <MetaPill Icon={FiClock}>{details.totalDuration} total</MetaPill>}
              <MetaPill Icon={FiGlobe}>{courseLanguage}</MetaPill>
              {createdOn && <MetaPill Icon={FiCalendar}>Created {createdOn}</MetaPill>}
            </div>

            {instructorName && (
              <div className="mt-6 flex items-center gap-3">
                <img
                  src={avatarFor(instructor)}
                  alt=""
                  className="h-10 w-10 rounded-full object-cover ring-2 ring-brand ring-offset-2 ring-offset-page"
                />
                <p className="text-sm text-content-muted">
                  Created by <span className="font-semibold text-content">{instructorName}</span>
                </p>
              </div>
            )}
          </div>

          <CoursePurchaseCard
            course={course}
            isEnrolled={isEnrolled}
            paymentLoading={paymentLoading}
            onBuy={handleBuyCourse}
            onAddToCart={handleAddToCart}
            onGoToCourse={goToCourse}
            onShare={handleShare}
          />
        </div>
      </section>

      {/* Details */}
      {/* Columns stretch to equal height so the sidebar can stay sticky while scrolling. */}
      <div className="mx-auto grid w-11/12 max-w-maxContent gap-10 py-12 lg:grid-cols-3">
        {/* On phones the stats come first; the section navigation is desktop-only. */}
        <aside className="order-first lg:order-none lg:col-start-3 lg:row-start-1">
          <CourseGlance
            stats={glanceStats}
            navItems={navItems}
            activeId={activeSectionId}
            onNavigate={scrollToSection}
          />
        </aside>

        <div className="space-y-14 lg:col-span-2 lg:col-start-1 lg:row-start-1">
          {(outcomeCount > 0 || requirements.length > 0) && (
            <Section
              id="course-outcomes"
              title="What you'll learn"
              subtitle="Skills you'll gain and what you need to get started"
              Icon={FiTarget}
            >
              <LearningOutcomes text={course.whatYouWillLearn} requirements={requirements} />
            </Section>
          )}

          <Section
            id="course-content"
            title="Course content"
            subtitle="Sections and lectures in this course"
            Icon={FiLayers}
          >
            <CourseContent sections={sections} totalDuration={details.totalDuration} isEnrolled={isEnrolled} />
          </Section>

          {instructor && (
            <Section id="course-instructor" title="Your instructor" Icon={FiUser}>
              <InstructorCard instructor={instructor} stats={details.instructorStats} />
            </Section>
          )}

          <Section id="course-reviews" title="Student reviews" Icon={FiStar}>
            <CourseReviews reviews={reviews} />
          </Section>

          {!isEnrolled && (
            <section className="relative isolate overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-selected via-surface to-surface px-6 py-12 text-center">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-16 -top-16 -z-10 h-56 w-56 rounded-full bg-brand/30 blur-3xl"
              />
              <h2 className="text-3xl font-extrabold tracking-tight text-content">Ready to start learning?</h2>
              <p className="mx-auto mt-3 max-w-xl text-content-muted">
                Get lifetime access to <span className="font-semibold text-content">{course.courseName}</span> for{" "}
                <span className="font-semibold text-content">{formatPrice(course.price)}</span>.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <button type="button" onClick={handleBuyCourse} disabled={paymentLoading} className={primaryButton}>
                  Buy now <FiArrowRight aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-surface px-5 py-3 font-semibold text-content transition hover:border-content-subtle"
                >
                  <FiShoppingCart aria-hidden="true" /> Add to cart
                </button>
              </div>
            </section>
          )}
        </div>
      </div>

      <Footer />
      {confirmationModal && <ConfirmationModal modalData={confirmationModal} />}
    </div>
  )
}
