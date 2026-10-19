import { useEffect, useState } from "react"
import { useDropzone } from "react-dropzone"
import { FiImage, FiUploadCloud, FiVideo } from "react-icons/fi"
import { Player } from "video-react"
import "video-react/dist/video-react.css"

// Image/video picker with preview. Form value: the new File, or the existing URL when editing/viewing.
const Upload = ({
  name,
  label,
  hideLabel = false,
  register,
  setValue,
  errors,
  video = false,
  viewData = null,
  editData = null,
}) => {
  const existing = viewData || editData || ""
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewSource, setPreviewSource] = useState(existing)

  const previewFile = (file) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onloadend = () => setPreviewSource(reader.result)
  }

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: video ? { "video/*": [".mp4"] } : { "image/*": [".jpeg", ".jpg", ".png"] },
    multiple: false,
    noClick: Boolean(previewSource),
    disabled: Boolean(viewData),
    onDrop: ([file]) => {
      if (!file) return
      setSelectedFile(file)
      previewFile(file)
    },
  })

  useEffect(() => {
    register(name, { required: true })
  }, [register, name])

  // Keep the existing upload as the value until it is replaced or removed, so editing doesn't
  // force a re-upload and unchanged media is not re-sent.
  useEffect(() => {
    setValue(name, selectedFile || (previewSource ? existing || null : null))
  }, [selectedFile, previewSource, existing, name, setValue])

  const remove = () => {
    setSelectedFile(null)
    setPreviewSource("")
  }

  const kind = video ? "video" : "image"

  return (
    <div className="flex flex-col gap-1.5">
      {!hideLabel && (
        <label htmlFor={name} className="text-sm font-medium text-content">
          {label}
          {!viewData && <span className="ml-0.5 text-danger">*</span>}
        </label>
      )}

      <div {...getRootProps()} className="outline-none">
        <input {...getInputProps()} id={name} />
        {previewSource ? (
          <div className="overflow-hidden rounded-xl border border-line bg-page">
            {video ? (
              <Player aspectRatio="16:9" playsInline src={previewSource} />
            ) : (
              <img src={previewSource} alt="" className="aspect-video w-full object-cover" />
            )}
            {!viewData && (
              <div className="flex items-center justify-between gap-3 border-t border-line bg-surface px-4 py-3 text-sm">
                <span className="truncate text-content-muted">{selectedFile?.name ?? `Current ${kind}`}</span>
                <span className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={open}
                    className="rounded-md px-2 py-1 font-semibold text-accent transition hover:bg-selected"
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={remove}
                    className="rounded-md px-2 py-1 font-semibold text-content-muted transition hover:bg-page hover:text-danger"
                  >
                    Remove
                  </button>
                </span>
              </div>
            )}
          </div>
        ) : (
          <div
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition ${
              isDragActive
                ? "border-brand bg-selected"
                : errors[name]
                ? "border-danger bg-page"
                : "border-line bg-page hover:border-brand"
            }`}
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-selected text-xl text-accent">
              <FiUploadCloud aria-hidden="true" />
            </span>
            <p className="mt-3 text-sm text-content">
              Drag and drop an {kind}, or <span className="font-semibold text-accent">browse</span>
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-content-muted">
              {video ? <FiVideo aria-hidden="true" /> : <FiImage aria-hidden="true" />}
              {video ? "MP4 video" : "JPG or PNG · 16:9 · at least 1024×576"}
            </p>
          </div>
        )}
      </div>

      {errors[name] && <span className="text-xs text-danger">{label} is required</span>}
    </div>
  )
}

export default Upload
