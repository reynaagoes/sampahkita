import type { Metadata } from "next"
import { Geist } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"

const geist = Geist({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "SampahKita",
  description: "Sampahmu, Nilai Kita",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className={geist.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
