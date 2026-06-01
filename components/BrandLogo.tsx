import Link from "next/link"

type BrandLogoProps = {
  href?: string
  compact?: boolean
  dark?: boolean
  className?: string
}

export default function BrandLogo({ href = "/", compact = false, dark = false, className = "" }: BrandLogoProps) {
  const content = (
    <span className={`brand-logo ${dark ? "brand-logo-dark" : ""} ${compact ? "brand-logo-compact" : ""} ${className}`}>
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 64 44" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M32 38C19 38 11 29.5 11 18.5C20.5 18.5 28.5 22.4 32 30.4C35.5 22.4 43.5 18.5 53 18.5C53 29.5 45 38 32 38Z" fill="#16A34A" />
          <path d="M32 31.5C32 19 38.2 10.6 48 6C48 17.8 41.8 26.4 32 31.5Z" fill="#22C55E" />
          <path d="M32 38V27.5M32 31.5C36.5 23.8 41.4 18 46.5 13.5M32 30.5C27.5 25.2 22.8 22.5 17.5 21.5" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      </span>
      <span className="brand-text">
        <span>Cuan</span>
        <span>Sampah</span>
      </span>
    </span>
  )

  return href ? (
    <Link href={href} className="brand-logo-link" aria-label="CuanSampah">
      {content}
    </Link>
  ) : (
    content
  )
}
