"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeft, RefreshCw, Search, MapPin, PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

// Dynamically import the Map component to avoid SSR issues with Leaflet
const MapComponent = dynamic(() => import("@/components/map-component"), {
  ssr: false,
  loading: () => <div className="w-full h-screen flex items-center justify-center">Loading map...</div>,
});

export default function PetaPage() {
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    jenisLokasi: "all",
    tingkatKepadatan: [1, 5],
    tingkatKeamanan: [1, 5],
    kenyamanan: [1, 5],
    aksesInternet: [1, 5],
  });
  const [geoJsonData, setGeoJsonData] = useState(null);
  const [filteredData, setFilteredData] = useState(null);
  const [locationTypes, setLocationTypes] = useState([]);
  const mapContainerRef = useRef(null);

  // Load default GeoJSON data
  useEffect(() => {
    // In a real app, you would load your GeoJSON file here
    // For now, we'll use a placeholder
    const defaultData = {
      type: "FeatureCollection",
      name: "ojek",
      crs: { type: "name", properties: { name: "urn:ogc:def:crs:OGC:1.3:CRS84" } },
      features: [
        {
          type: "Feature",
          properties: {
            nama_lokasi: "ATM BNI Polmed",
            jenis_lokasi: "Universitas",
            jam_ramainya: "12.00-13.30WIB & 17.00-18.00WIB",
            tingkat_kepadatan: 4,
            fasilitas: "Duduk pinggir jalan",
            tingkat_keamanan: 4,
            akses_internet: 5,
            kenyamanan: 3,
            alamat: "USU, Jl. Almamater, Padang Bulan, Kec. Medan Baru, Kota Medan, Sumatera Utara 20155",
          },
          geometry: { type: "Point", coordinates: [98.653171546104915, 3.56339192735697] },
        },
        {
          type: "Feature",
          properties: {
            nama_lokasi: "Alfamart Pembangunan",
            jenis_lokasi: "Minimarket",
            jam_ramainya: "06.30-07.30WIB & 20.00-22.00WIB",
            tingkat_kepadatan: 4,
            fasilitas: "Duduk dekat alfamart",
            tingkat_keamanan: 5,
            akses_internet: 5,
            kenyamanan: 4,
            alamat: "Jl. Pembangunan 98-76, Padang Bulan, Kec. Medan Baru, Kota Medan, Sumatera Utara 20155",
          },
          geometry: { type: "Point", coordinates: [98.652195416492731, 3.560159525410844] },
        },
        {
          type: "Feature",
          properties: {
            nama_lokasi: "SPBU Dr Mansyur",
            jenis_lokasi: "SPBU",
            jam_ramainya: "12.00-16.00WIB",
            tingkat_kepadatan: 3,
            fasilitas: "Tempat duduk, Kamar Mandi, Indomaret",
            tingkat_keamanan: 5,
            akses_internet: 5,
            kenyamanan: 5,
            alamat: "HM92+2GR, Padang Bulan Selayang I, Kec. Medan Selayang, Kota Medan, Sumatera Utara 20153",
          },
          geometry: { type: "Point", coordinates: [98.651290157587624, 3.567940892002607] },
        },
        {
          type: "Feature",
          properties: {
            nama_lokasi: "SMKN 8",
            jenis_lokasi: "Sekolah",
            jam_ramainya: "12.00WIB",
            tingkat_kepadatan: 5,
            fasilitas: "Duduk pinggir jalan",
            tingkat_keamanan: 3,
            akses_internet: 5,
            kenyamanan: 3,
            alamat: "Jl. Dr. Mansyur No.79, Padang Bulan Selayang I, Kec. Medan Selayang, Kota Medan, Sumatera Utara 20154",
          },
          geometry: { type: "Point", coordinates: [98.646668323732726, 3.5663386121371] },
        },
        {
          type: "Feature",
          properties: {
            nama_lokasi: "Dharma Pancasila",
            jenis_lokasi: "Sekolah",
            jam_ramainya: "12.00-13.00WIB & 16.00-17.00WIB",
            tingkat_kepadatan: 5,
            fasilitas: "Duduk pinggir jalan",
            tingkat_keamanan: 4,
            akses_internet: 5,
            kenyamanan: 3,
            alamat: "Jl. Dr. Mansyur No.A A, RW.71, Padang Bulan Selayang I, Medan Selayang, Medan City, North Sumatra 20154",
          },
          geometry: { type: "Point", coordinates: [98.648600072846165, 3.56717348462609] },
        },
        {
          type: "Feature",
          properties: {
            nama_lokasi: "Indomaret Hybrid Jamin Ginting",
            jenis_lokasi: "Minimarket",
            jam_ramainya: "20.00-22.00 WIB",
            tingkat_kepadatan: 4,
            fasilitas: "Tempat Duduk",
            tingkat_keamanan: 4,
            akses_internet: 5,
            kenyamanan: 5,
            alamat: "Jalan Jamin Ginting, Titi Rantai, Medan, Titi Rantai, Kec. Medan Baru, Kota Medan, Sumatera Utara 20142",
          },
          geometry: { type: "Point", coordinates: [98.660316125499847, 3.552095332910568] },
        },
        {
          type: "Feature",
          properties: {
            nama_lokasi: "SPBU 14201106 PT Daun Mas Permai",
            jenis_lokasi: "SPBU",
            jam_ramainya: "17.00-23.00WIB",
            tingkat_kepadatan: 3,
            fasilitas: "Toilet, Minimarket",
            tingkat_keamanan: 5,
            akses_internet: 5,
            kenyamanan: 4,
            alamat: "Jl. Jenderal Besar A.H. Nasution, Pangkalan Masyhur, Kec. Medan Johor, Kota Medan, Sumatera Utara 20143",
          },
          geometry: { type: "Point", coordinates: [98.665039525424774, 3.541493190185551] },
        },
        {
          type: "Feature",
          properties: {
            nama_lokasi: "Indomaret Simpang Eka Warni",
            jenis_lokasi: "Minimarket",
            jam_ramainya: "06.00-07.00",
            tingkat_kepadatan: 4,
            fasilitas: "Toilet",
            tingkat_keamanan: 4,
            akses_internet: 5,
            kenyamanan: 3,
            alamat: "Gedung Johor, Kota Medan, Sumatera Utara",
          },
          geometry: { type: "Point", coordinates: [98.675372024199262, 3.518621788980453] },
        },
        {
          type: "Feature",
          properties: {
            nama_lokasi: "Kantor BNI Medan",
            jenis_lokasi: "Bank",
            jam_ramainya: "12.00-17.00 WIB",
            tingkat_kepadatan: 5,
            fasilitas: "Duduk pinggir jalan",
            tingkat_keamanan: 4,
            akses_internet: 5,
            kenyamanan: 3,
            alamat: "Jl. Pemuda No.12, A U R, Kec. Medan Maimun, Kota Medan, Sumatera Utara 20212",
          },
          geometry: { type: "Point", coordinates: [98.680520579268247, 3.583162999779454] },
        },
        {
          type: "Feature",
          properties: {
            nama_lokasi: "Warkop Candu Kopi",
            jenis_lokasi: "Warkop",
            jam_ramainya: "12.00-15.00 WIB & 19.00-22.00 WIB",
            tingkat_kepadatan: 3,
            fasilitas: "Wifi, Toilet, Tempat duduk",
            tingkat_keamanan: 4,
            akses_internet: 5,
            kenyamanan: 4,
            alamat: "Jl. Rajawali No.87b, Sei Sikambing B, Kec. Medan Sunggal, Kota Medan, Sumatera Utara 20122",
          },
          geometry: { type: "Point", coordinates: [98.633024114300213, 3.582840219135428] },
        },
        {
          type: "Feature",
          properties: {
            nama_lokasi: "SPBU Sei Serayu",
            jenis_lokasi: "SPBU",
            jam_ramainya: "19.00-22.00 WIB",
            tingkat_kepadatan: 3,
            fasilitas: "Toilet",
            tingkat_keamanan: 4,
            akses_internet: 5,
            kenyamanan: 3,
            alamat: "Jalan Sei Serayu No.110, Babura, Medan Sunggal, Tj. Rejo, Kec. Medan Sunggal, Kota Medan, Sumatera Utara 20154",
          },
          geometry: { type: "Point", coordinates: [98.643566487347996, 3.577579565362996] },
        },
        {
          type: "Feature",
          properties: {
            nama_lokasi: "Mesjid Jamik Pinang Baris",
            jenis_lokasi: "Mesjid",
            jam_ramainya: "07.00-12.00 WIB dan 17.00-21.00 WIB",
            tingkat_kepadatan: 5,
            fasilitas: "Toilet, Tempat Ibadah",
            tingkat_keamanan: 5,
            akses_internet: 5,
            kenyamanan: 5,
            alamat: "Sunggal, Jl. Tahi Bonar Simatupang, Sunggal, Kec. Medan Sunggal, Kota Medan, Sumatera Utara 20127",
          },
          geometry: { type: "Point", coordinates: [98.609361573309869, 3.596414649894745] },
        },
        {
          type: "Feature",
          properties: {
            nama_lokasi: "Masjid Ar Rahman",
            jenis_lokasi: "Mesjid",
            jam_ramainya: "07.00-09.00 WIB dan 16.00-19.00 WIB",
            tingkat_kepadatan: 4,
            fasilitas: null,
            tingkat_keamanan: 5,
            akses_internet: 5,
            kenyamanan: 5,
            alamat: "Jl. Brigjend Zein Hamid No.17, Titi Kuning, Kec. Medan Johor, Kota Medan, Sumatera Utara 20219",
          },
          geometry: { type: "Point", coordinates: [98.684127077168299, 3.537224814852741] },
        },
      ],
    };

    setGeoJsonData(defaultData);
    setFilteredData(defaultData);
  }, []);

  // Extract unique location types from GeoJSON data
  useEffect(() => {
    if (geoJsonData && geoJsonData.features) {
      const types = [...new Set(geoJsonData.features.map((feature) => feature.properties.jenis_lokasi))];
      setLocationTypes(types);
    }
  }, [geoJsonData]);

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        setGeoJsonData(data);
        setFilteredData(data);
        toast({
          title: "Data berhasil diupload",
          description: `File ${file.name} berhasil dimuat.`,
        });
      } catch (error) {
        toast({
          title: "Error saat memproses file",
          description: "File GeoJSON tidak valid.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  // Apply filters and search
  useEffect(() => {
    if (!geoJsonData) return;

    const filtered = { ...geoJsonData };
    filtered.features = geoJsonData.features.filter((feature) => {
      const props = feature.properties;

      // Filter by jenis_lokasi
      if (filters.jenisLokasi !== "all" && props.jenis_lokasi !== filters.jenisLokasi) {
        return false;
      }

      // Filter by tingkat_kepadatan
      if (props.tingkat_kepadatan < filters.tingkatKepadatan[0] || props.tingkat_kepadatan > filters.tingkatKepadatan[1]) {
        return false;
      }

      // Filter by tingkat_keamanan
      if (props.tingkat_keamanan < filters.tingkatKeamanan[0] || props.tingkat_keamanan > filters.tingkatKeamanan[1]) {
        return false;
      }

      // Filter by kenyamanan
      if (props.kenyamanan < filters.kenyamanan[0] || props.kenyamanan > filters.kenyamanan[1]) {
        return false;
      }

      // Filter by akses_internet
      if (props.akses_internet < filters.aksesInternet[0] || props.akses_internet > filters.aksesInternet[1]) {
        return false;
      }

      // Search by name or address
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return props.nama_lokasi.toLowerCase().includes(query) || props.alamat.toLowerCase().includes(query);
      }

      return true;
    });

    setFilteredData(filtered);
  }, [geoJsonData, filters, searchQuery]);

  // Reset filters
  const resetFilters = () => {
    setFilters({
      jenisLokasi: "all",
      tingkatKepadatan: [1, 5],
      tingkatKeamanan: [1, 5],
      kenyamanan: [1, 5],
      aksesInternet: [1, 5],
    });
    setSearchQuery("");
    setFilteredData(geoJsonData);
  };

  // Toggle sidebar and trigger map resize
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);

    // Add a class to prevent scrolling when sidebar is open on mobile
    if (!sidebarOpen) {
      document.body.classList.add("overflow-hidden", "sm:overflow-auto");
    } else {
      document.body.classList.remove("overflow-hidden", "sm:overflow-auto");
    }

    // Give time for the DOM to update before triggering resize
    setTimeout(() => {
      // Dispatch a resize event to make sure the map updates
      window.dispatchEvent(new Event("resize"));
    }, 300);
  };

  // And add a cleanup effect to remove the class when component unmounts
  useEffect(() => {
    return () => {
      document.body.classList.remove("overflow-hidden", "sm:overflow-auto");
    };
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (mapContainerRef.current) {
        const width = sidebarOpen && window.innerWidth >= 640 ? "calc(100% - 320px)" : "100%";
        mapContainerRef.current.style.width = width;

        // Trigger map resize
        window.dispatchEvent(new Event("resize"));
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [sidebarOpen]);

  return (
    <div className="flex flex-col h-screen">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <ArrowLeft className="h-5 w-5" />
          <span>Kembali</span>
        </Link>
        <div className="ml-auto flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={toggleSidebar}>
            {sidebarOpen ? (
              <>
                <PanelLeftClose className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Sembunyikan Filter</span>
                <span className="sm:hidden">Tutup</span>
              </>
            ) : (
              <>
                <PanelLeftOpen className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Tampilkan Filter</span>
                <span className="sm:hidden">Filter</span>
              </>
            )}
          </Button>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden relative">
        <aside className={cn("border-r bg-background overflow-y-auto transition-all duration-300 h-full", sidebarOpen ? "w-full sm:w-80 absolute sm:relative z-10 left-0 top-0" : "w-0 -left-full sm:-left-80 absolute sm:relative z-10")}>
          <div className="p-4 space-y-4 min-w-[320px] sm:min-w-[280px]">
            <div className="flex justify-between items-center mb-2 sm:hidden">
              <h2 className="text-lg font-semibold">Filter & Pencarian</h2>
              <Button variant="ghost" size="sm" onClick={toggleSidebar} className="p-1 h-8 w-8">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x">
                  <path d="M18 6 6 18"></path>
                  <path d="m6 6 12 12"></path>
                </svg>
                <span className="sr-only">Tutup</span>
              </Button>
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-2">Pencarian</h2>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="search" placeholder="Cari lokasi..." className="pl-8" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </div>
            <Separator />
            <div>
              <h2 className="text-lg font-semibold mb-2">Filter</h2>
              <Tabs defaultValue="jenis">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="jenis">Jenis Lokasi</TabsTrigger>
                  <TabsTrigger value="rating">Rating</TabsTrigger>
                </TabsList>
                <TabsContent value="jenis" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="jenis-lokasi">Jenis Lokasi</Label>
                    <Select value={filters.jenisLokasi} onValueChange={(value) => setFilters({ ...filters, jenisLokasi: value })}>
                      <SelectTrigger id="jenis-lokasi">
                        <SelectValue placeholder="Semua jenis lokasi" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua</SelectItem>
                        {locationTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
                <TabsContent value="rating" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>
                        Tingkat Kepadatan ({filters.tingkatKepadatan[0]}-{filters.tingkatKepadatan[1]})
                      </Label>
                    </div>
                    <Slider defaultValue={[1, 5]} min={1} max={5} step={1} value={filters.tingkatKepadatan} onValueChange={(value) => setFilters({ ...filters, tingkatKepadatan: value })} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>
                        Tingkat Keamanan ({filters.tingkatKeamanan[0]}-{filters.tingkatKeamanan[1]})
                      </Label>
                    </div>
                    <Slider defaultValue={[1, 5]} min={1} max={5} step={1} value={filters.tingkatKeamanan} onValueChange={(value) => setFilters({ ...filters, tingkatKeamanan: value })} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>
                        Kenyamanan ({filters.kenyamanan[0]}-{filters.kenyamanan[1]})
                      </Label>
                    </div>
                    <Slider defaultValue={[1, 5]} min={1} max={5} step={1} value={filters.kenyamanan} onValueChange={(value) => setFilters({ ...filters, kenyamanan: value })} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>
                        Akses Internet ({filters.aksesInternet[0]}-{filters.aksesInternet[1]})
                      </Label>
                    </div>
                    <Slider defaultValue={[1, 5]} min={1} max={5} step={1} value={filters.aksesInternet} onValueChange={(value) => setFilters({ ...filters, aksesInternet: value })} />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            <Separator />
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold mb-2">Update Data</h2>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="geojson-upload">Upload GeoJSON</Label>
                  <div className="flex w-full items-center gap-2">
                    <Input id="geojson-upload" type="file" accept=".json,.geojson" className="w-full" onChange={handleFileUpload} />
                  </div>
                </div>
              </div>
              <Button variant="outline" className="w-full" onClick={resetFilters}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset Filter
              </Button>
            </div>
            <div className="p-3 bg-blue-50 rounded-md border border-blue-100">
              <h3 className="text-sm font-semibold flex items-center gap-1 text-blue-700">
                <MapPin className="h-4 w-4" />
                Fitur Lokasi Saya
              </h3>
              <p className="text-xs text-blue-600 mt-1">Klik tombol lokasi di peta untuk menemukan lokasi Anda dan melihat rute ke pangkalan terdekat.</p>
            </div>
          </div>
        </aside>
        <main
          ref={mapContainerRef}
          className="flex-1 overflow-hidden w-full h-full"
          style={{
            width: sidebarOpen ? (window.innerWidth < 640 ? "100%" : "calc(100% - 320px)") : "100%",
            transition: "width 0.3s ease",
            position: "relative",
            zIndex: 1,
          }}
        >
          {filteredData && <MapComponent geoJsonData={filteredData} sidebarOpen={sidebarOpen} />}
        </main>
      </div>
    </div>
  );
}
