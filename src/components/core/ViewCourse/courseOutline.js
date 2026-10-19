// Helpers for walking a course's sections and lectures in order.

// Every lecture in playback order, with its section, so prev/next is just index ± 1.
export const flattenLectures = (sections = []) =>
  sections.flatMap((section, sectionIndex) =>
    (section.subSection ?? []).map((lecture) => ({ lecture, section, sectionIndex }))
  )

export const lecturePath = (courseId, { section, lecture }) =>
  `/view-course/${courseId}/section/${section._id}/sub-section/${lecture._id}`

// Where to resume: the first unfinished lecture, or the first lecture once everything is done.
export const resumeLecture = (lectures, completed) =>
  lectures.find(({ lecture }) => !completed.has(String(lecture._id))) ?? lectures[0] ?? null

const toSeconds = (value) => {
  const seconds = Number(value)
  return Number.isFinite(seconds) && seconds > 0 ? seconds : 0
}

// 75 -> "1:15", 3725 -> "1:02:05"
export const formatClock = (value) => {
  const total = Math.round(toSeconds(value))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = String(total % 60).padStart(2, "0")
  return h ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`
}

// 3725 -> "1h 2m", 75 -> "1m", 20 -> "20s"
export const formatLength = (value) => {
  const total = Math.round(toSeconds(value))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  if (h) return m ? `${h}h ${m}m` : `${h}h`
  if (m) return `${m}m`
  return `${total}s`
}

export const sectionSeconds = (section) =>
  (section.subSection ?? []).reduce((sum, lecture) => sum + toSeconds(lecture.timeDuration), 0)
