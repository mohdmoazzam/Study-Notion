import { useRef, useState } from "react"
import { toast } from "react-hot-toast"
import { FiUpload } from "react-icons/fi"
import { useDispatch, useSelector } from "react-redux"

import { updateDisplayPicture } from "../../../../services/operations/settingsAPI"
import { FormCard, primaryButtonClass, secondaryButtonClass } from "../../../common/formUi"

const MAX_SIZE_MB = 5

const ChangeProfilePicture = () => {
  const { token } = useSelector((state) => state.auth)
  const { user } = useSelector((state) => state.profile)
  const dispatch = useDispatch()

  const [saving, setSaving] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [previewSource, setPreviewSource] = useState(null)
  const fileInputRef = useRef(null)

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]
    event.target.value = "" // allow picking the same file again later
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file")
      return
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`Image must be ${MAX_SIZE_MB} MB or smaller`)
      return
    }
    setImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setPreviewSource(reader.result)
    reader.readAsDataURL(file)
  }

  const clearSelection = () => {
    setImageFile(null)
    setPreviewSource(null)
  }

  const handleSave = async () => {
    const formData = new FormData()
    formData.append("displayPicture", imageFile)
    setSaving(true)
    const saved = await dispatch(updateDisplayPicture(token, formData))
    setSaving(false)
    if (saved) clearSelection()
  }

  return (
    <FormCard id="profile-photo" title="Profile photo" description="Shown on your profile, reviews and courses.">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <img
          src={previewSource || user?.image}
          alt=""
          className={`h-20 w-20 shrink-0 rounded-full object-cover ring-4 ${previewSource ? "ring-brand/50" : "ring-page"}`}
        />
        <div>
          <p className="text-sm text-content-muted">
            {imageFile ? (
              <>
                New photo: <span className="font-medium text-content">{imageFile.name}</span>
              </>
            ) : (
              `JPG, PNG or GIF, up to ${MAX_SIZE_MB} MB. A square photo works best.`
            )}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/gif"
              onChange={handleFileChange}
              className="hidden"
            />
            {imageFile ? (
              <>
                <button type="button" onClick={handleSave} disabled={saving} className={primaryButtonClass}>
                  {saving ? "Saving..." : "Save photo"}
                </button>
                <button type="button" onClick={clearSelection} disabled={saving} className={secondaryButtonClass}>
                  Cancel
                </button>
              </>
            ) : (
              <button type="button" onClick={() => fileInputRef.current?.click()} className={secondaryButtonClass}>
                <FiUpload aria-hidden="true" /> Upload new photo
              </button>
            )}
          </div>
        </div>
      </div>
    </FormCard>
  )
}

export default ChangeProfilePicture
