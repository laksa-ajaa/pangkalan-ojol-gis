import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <MapPin className="h-6 w-6" />
          <span>Peta Pangkalan Ojek Online</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link href="/peta" className="text-sm font-medium hover:underline underline-offset-4">
            Lihat Peta
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2">
              {/* Kolom Judul & Deskripsi */}
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Pemetaan Rekomendasi Lokasi Pangkalan Ojek Online</h1>
                  <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    Temukan lokasi pangkalan ojek online terbaik berdasarkan berbagai kriteria seperti kepadatan, keamanan, dan fasilitas.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/peta">
                    <Button className="gap-1">
                      Lihat Peta
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Kolom Fitur */}
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl">Fitur Utama</h2>
                  <ul className="grid gap-3">
                    <li className="flex items-start gap-2">
                      <div className="rounded-full bg-primary/10 p-1">
                        <MapPin className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">Peta Interaktif</h3>
                        <p className="text-sm text-gray-500">Peta interaktif dengan marker lokasi pangkalan ojek online</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="rounded-full bg-primary/10 p-1">
                        <MapPin className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">Filter Lokasi</h3>
                        <p className="text-sm text-gray-500">Filter lokasi berdasarkan jenis, kepadatan, dan jam ramai</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="rounded-full bg-primary/10 p-1">
                        <MapPin className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">Pencarian</h3>
                        <p className="text-sm text-gray-500">Cari lokasi berdasarkan nama atau alamat</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="rounded-full bg-primary/10 p-1">
                        <MapPin className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">Update Data</h3>
                        <p className="text-sm text-gray-500">Update data dengan mengunggah file GeoJSON</p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section Tentang Proyek */}
        <section className="w-full py-8 md:py-12 lg:py-16 bg-gray-50 border-t">
          <div className="container px-4 md:px-6 space-y-4">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Tentang Proyek</h2>
            <p className="text-gray-700 text-base max-w-3xl">
              Proyek ini dibuat oleh <strong>Laksmana Chairutama (2205181045)</strong> sebagai bagian dari tugas akhir dalam pengembangan aplikasi berbasis web dengan teknologi GIS. Aplikasi ini bertujuan untuk membantu driver dan pengguna
              ojek online menemukan lokasi pangkalan strategis berdasarkan data kepadatan, keamanan, dan fasilitas sekitar.
            </p>
          </div>
        </section>
      </main>

      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full border-t px-4 md:px-6">
        <p className="text-xs text-gray-500">© {new Date().getFullYear()} Peta Pangkalan Ojek Online. Semua hak cipta dilindungi.</p>
      </footer>
    </div>
  );
}
