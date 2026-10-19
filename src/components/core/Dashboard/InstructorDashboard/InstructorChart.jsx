import { useMemo, useState } from "react"
import { Chart, registerables } from "chart.js"
import { Bar } from "react-chartjs-2"
import { FiBarChart2 } from "react-icons/fi"

import { formatAmount } from "../../../../utils/formatPrice"

Chart.register(...registerables)

const MAX_COURSES = 8
const METRICS = {
  students: { label: "Students", value: (course) => course.totalStudentsEnrolled, format: (v) => v.toLocaleString("en-IN") },
  earnings: { label: "Earnings", value: (course) => course.totalAmountGenerated, format: formatAmount },
}

// Chart colors come from the theme tokens, so the chart follows light/dark mode.
const themeColor = (name, alpha = 1) => {
  const channels = getComputedStyle(document.documentElement).getPropertyValue(`--color-${name}`).trim()
  return channels ? `rgb(${channels} / ${alpha})` : undefined
}

const shorten = (text = "", max = 22) => (text.length > max ? `${text.slice(0, max - 1)}…` : text)

// Horizontal bars (best performers first): far easier to compare than a pie with many slices.
export const InstructorChart = ({ courses = [] }) => {
  const [metricKey, setMetricKey] = useState("students")
  const metric = METRICS[metricKey]

  const ranked = useMemo(
    () => [...courses].sort((a, b) => metric.value(b) - metric.value(a)).slice(0, MAX_COURSES),
    [courses, metric]
  )
  const hasData = ranked.some((course) => metric.value(course) > 0)

  const data = {
    labels: ranked.map((course) => shorten(course.courseName)),
    datasets: [
      {
        data: ranked.map(metric.value),
        backgroundColor: themeColor("brand", 0.85),
        hoverBackgroundColor: themeColor("brand"),
        borderRadius: 6,
        maxBarThickness: 28,
      },
    ],
  }

  const options = {
    indexAxis: "y",
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (items) => ranked[items[0].dataIndex]?.courseName,
          label: (item) => `${metric.label}: ${metric.format(item.raw)}`,
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: { color: themeColor("line") },
        ticks: { color: themeColor("content-muted"), precision: 0, callback: (value) => metric.format(value) },
      },
      y: { grid: { display: false }, ticks: { color: themeColor("content") } },
    },
  }

  return (
    <section className="flex flex-col rounded-2xl border border-line bg-surface p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-content">Performance by course</h2>
          <p className="text-sm text-content-muted">
            {courses.length > MAX_COURSES ? `Top ${MAX_COURSES} courses` : "All your courses"} by {metric.label.toLowerCase()}
          </p>
        </div>
        <div role="group" aria-label="Chart metric" className="flex rounded-xl border border-line bg-page p-1">
          {Object.entries(METRICS).map(([key, { label }]) => (
            <button
              key={key}
              type="button"
              aria-pressed={metricKey === key}
              onClick={() => setMetricKey(key)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
                metricKey === key ? "bg-brand text-on-brand" : "text-content-muted hover:text-content"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {hasData ? (
        <div className="relative mt-6" style={{ height: Math.max(180, ranked.length * 48) }}>
          <Bar data={data} options={options} />
        </div>
      ) : (
        <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-page px-6 py-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-selected text-xl text-accent">
            <FiBarChart2 aria-hidden="true" />
          </span>
          <p className="mt-3 font-semibold text-content">No {metric.label.toLowerCase()} yet</p>
          <p className="mt-1 max-w-sm text-sm text-content-muted">
            Once students enroll in your published courses, you&apos;ll see how each course performs here.
          </p>
        </div>
      )}
    </section>
  )
}
