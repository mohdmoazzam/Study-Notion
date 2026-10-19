import { FiMail, FiMapPin, FiPhone } from "react-icons/fi"

const CONTACT_METHODS = [
  {
    Icon: FiMail,
    title: "Email us",
    description: "Our friendly team is here to help.",
    value: "info@studynotion.com",
    href: "mailto:info@studynotion.com",
  },
  {
    Icon: FiMapPin,
    title: "Visit us",
    description: "Come and say hello at our office HQ.",
    value: "Village Gulariya 1st Block 1st Cross, US Nagar, Kashipur-244713",
  },
  {
    Icon: FiPhone,
    title: "Call us",
    description: "Mon - Fri, 8am to 5pm",
    value: "+123 456 7869",
    href: "tel:+1234567869",
  },
]

function ContactDetails() {
  return (
    <div className="flex flex-col gap-4">
      {CONTACT_METHODS.map(({ Icon, title, description, value, href }) => (
        <div key={title} className="flex gap-4 rounded-2xl border border-line bg-surface p-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-selected text-lg text-accent">
            <Icon aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 className="font-semibold text-content">{title}</h3>
            <p className="mt-0.5 text-sm text-content-muted">{description}</p>
            {href ? (
              <a href={href} className="mt-2 inline-block break-words text-sm font-medium text-content hover:text-accent">
                {value}
              </a>
            ) : (
              <p className="mt-2 text-sm font-medium text-content">{value}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default ContactDetails
