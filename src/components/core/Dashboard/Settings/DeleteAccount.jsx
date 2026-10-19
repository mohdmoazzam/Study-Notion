import { useState } from "react"
import { FiAlertTriangle, FiTrash2 } from "react-icons/fi"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"

import { deleteProfile } from "../../../../services/operations/settingsAPI"
import { inputClass, secondaryButtonClass } from "../../../common/formUi"

const CONFIRM_WORD = "DELETE"

// Deleting is permanent, so it needs an explicit, typed confirmation.
const DeleteAccount = () => {
  const { token } = useSelector((state) => state.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [confirming, setConfirming] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const [deleting, setDeleting] = useState(false)

  const cancel = () => {
    setConfirming(false)
    setConfirmText("")
  }

  const handleDelete = async () => {
    setDeleting(true)
    await dispatch(deleteProfile(token, navigate))
    setDeleting(false)
  }

  return (
    <section className="rounded-2xl border border-danger/40 bg-surface p-6 shadow-sm sm:p-8">
      <div className="flex gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-danger/10 text-lg text-danger">
          <FiAlertTriangle aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-content">Delete account</h2>
          <p className="mt-1 text-sm text-content-muted">
            Permanently delete your account and everything linked to it, including purchased courses and your
            progress. This can&apos;t be undone.
          </p>

          {!confirming ? (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="mt-5 inline-flex items-center gap-2 rounded-lg border border-danger/50 px-5 py-2.5 font-semibold text-danger transition hover:bg-danger/10"
            >
              <FiTrash2 aria-hidden="true" /> Delete account
            </button>
          ) : (
            <div className="mt-5 rounded-xl border border-danger/30 bg-danger/5 p-4">
              <label htmlFor="confirmDelete" className="text-sm font-medium text-content">
                Type <span className="font-bold text-danger">{CONFIRM_WORD}</span> to confirm
              </label>
              <input
                id="confirmDelete"
                value={confirmText}
                onChange={(event) => setConfirmText(event.target.value)}
                autoComplete="off"
                autoFocus
                className={`${inputClass(false)} mt-2`}
              />
              <div className="mt-4 flex flex-wrap justify-end gap-3">
                <button type="button" onClick={cancel} disabled={deleting} className={secondaryButtonClass}>
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={confirmText !== CONFIRM_WORD || deleting}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-danger px-5 py-2.5 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <FiTrash2 aria-hidden="true" /> {deleting ? "Deleting..." : "Permanently delete account"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default DeleteAccount
