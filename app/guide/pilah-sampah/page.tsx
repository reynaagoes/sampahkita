import Navbar from "@/components/Navbar"
import Link from "next/link"

const GUIDES = [
  {
    title: "Plastik",
    examples: "Botol plastik, kantong, wadah makanan",
    tips: "Bilas dan keringkan sebelum dikumpulkan",
  },
  {
    title: "Kertas",
    examples: "Kardus, koran, buku",
    tips: "Pisahkan dari sampah basah",
  },
  {
    title: "Kaca",
    examples: "Botol kaca, toples",
    tips: "Bungkus pecahan kaca agar aman",
  },
  {
    title: "Logam",
    examples: "Kaleng, besi, aluminium",
    tips: "Bersihkan sisa makanan atau minuman",
  },
  {
    title: "Elektronik",
    examples: "Kabel, baterai, HP lama",
    tips: "Jangan dicampur dengan sampah basah",
  },
]

export default function PilahSampahGuidePage() {
  return (
    <main className="app-page">
      <div className="dashboard-top">
        <Navbar userName="" role="HOUSEHOLD" />
        <section className="household-hero">
          <div>
            <span className="section-kicker">Panduan Rumah Tangga</span>
            <h1>Panduan Pilah Sampah</h1>
            <p>Pemisahan sampah yang rapi membantu pengepul memvalidasi lebih cepat dan memperlancar proses daur ulang.</p>
          </div>
          <div className="hero-service-note">
            <strong>Rapi</strong>
            <span>Lebih cepat divalidasi</span>
          </div>
        </section>
      </div>

      <section className="dashboard-container">
        <section className="classic-panel" style={{ padding: "18px" }}>
          <div className="empty-state" style={{ marginBottom: "16px" }}>
            <h3>Sampah yang terpilah rapi lebih cepat divalidasi pengepul dan membantu proses daur ulang.</h3>
          </div>

          <div className="guide-grid">
            {GUIDES.map((item) => (
              <article className="guide-card" key={item.title}>
                <span className="data-eyebrow">{item.title}</span>
                <h3>{item.examples}</h3>
                <p>{item.tips}</p>
              </article>
            ))}
          </div>

          <div className="workspace-footer" style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center" }}>
            <p style={{ margin: 0, color: "var(--muted)", fontSize: "13px" }}>Gunakan panduan ini sebelum membuat request angkut gratis.</p>
            <Link className="green-small-btn" href="/household/request/new">Buat Request</Link>
          </div>
        </section>
      </section>
    </main>
  )
}
