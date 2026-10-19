import { FaArrowRight } from "react-icons/fa"

import LinkButton from "../../common/LinkButton"

function CallToAction() {
  return (
    <section className="mx-auto w-11/12 max-w-maxContent pb-20">
      <div className="rounded-3xl border border-line bg-surface px-6 py-14 text-center sm:px-12">
        <h2 className="text-3xl font-bold tracking-tight text-content">Ready to start your journey?</h2>
        <p className="mx-auto mt-3 max-w-xl text-content-muted">
          Join learners and instructors on StudyNotion. Signing up is free.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <LinkButton to="/signup">
            Create free account <FaArrowRight />
          </LinkButton>
          <LinkButton to="/login" variant="secondary">
            Log in
          </LinkButton>
        </div>
      </div>
    </section>
  )
}

export default CallToAction
