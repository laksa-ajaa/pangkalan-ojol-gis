"use client";

import React, { useState, useEffect } from "react";
import { GoogleMap, LoadScript, Marker, InfoWindow } from "@react-google-maps/api";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import type { DateRange } from "react-day-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

const MapComponent = () => {
  const [map, setMap] = useState(null);
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(new Date().setDate(new Date().getDate() + 7)),
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newLocation, setNewLocation] = useState({
    nama_tempat: "",
    alamat: "",
    deskripsi: "",
    latitude: 0,
    longitude: 0,
    website: "",
    nomor_telepon: "",
    jam_buka: "",
    jam_tutup: "",
    harga_tiket: 0,
    foto_url: "",
    kategori: "",
    fasilitas: "",
    aturan: "",
    tips_berkunjung: "",
    ulasan: "",
    rating: 0,
    jam_ramainya: "",
  });
  const { toast } = useToast();
  const [progress, setProgress] = React.useState(0);

  const onMapLoad = React.useCallback((map) => {
    setMap(map);
  }, []);

  const onUnmount = React.useCallback((map) => {
    setMap(null);
  }, []);

  const mapContainerStyle = {
    width: "100%",
    height: "800px",
  };

  const center = {
    lat: -7.7524545,
    lng: 110.3657786,
  };

  const options = {
    disableDefaultUI: true,
    zoomControl: true,
  };

  useEffect(() => {
    fetch("https://be-palembang-2.vercel.app/api/tempat_wisata")
      .then((response) => response.json())
      .then((data) => {
        setLocations(data.data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setIsLoading(false);
      });
  }, []);

  const handleMarkerClick = (location) => {
    setSelectedLocation(location);
  };

  const handleMapClick = (event) => {
    // console.log('Latitude:', event.latLng.lat());
    // console.log('Longitude:', event.latLng.lng());
    setNewLocation({
      ...newLocation,
      latitude: event.latLng.lat(),
      longitude: event.latLng.lng(),
    });
    setIsFormOpen(true);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setNewLocation((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch("https://be-palembang-2.vercel.app/api/tempat_wisata", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newLocation),
      });

      if (response.ok) {
        toast({
          title: "You submitted successfully!",
          description: "Your data has been recorded.",
        });
        setLocations([...locations, newLocation]);
        setNewLocation({
          nama_tempat: "",
          alamat: "",
          deskripsi: "",
          latitude: 0,
          longitude: 0,
          website: "",
          nomor_telepon: "",
          jam_buka: "",
          jam_tutup: "",
          harga_tiket: 0,
          foto_url: "",
          kategori: "",
          fasilitas: "",
          aturan: "",
          tips_berkunjung: "",
          ulasan: "",
          rating: 0,
          jam_ramainya: "",
        });
        setIsFormOpen(false);
      } else {
        console.error("Failed to submit data");
      }
    } catch (error) {
      console.error("Error submitting data:", error);
    }
  };

  return (
    <div>
      <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}>
        <GoogleMap mapContainerStyle={mapContainerStyle} center={center} zoom={12} options={options} onLoad={onMapLoad} onUnmount={onUnmount} onClick={handleMapClick}>
          {isLoading
            ? // Show skeleton loaders while loading
              [...Array(5)].map((_, index) => (
                <Marker
                  key={`skeleton-${index}`}
                  position={{
                    lat: center.lat + (Math.random() - 0.5) * 0.1, // Slightly random position
                    lng: center.lng + (Math.random() - 0.5) * 0.1,
                  }}
                  icon={{
                    url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png", // Placeholder icon
                    scaledSize: new window.google.maps.Size(25, 25),
                  }}
                />
              ))
            : locations.map((location) => <Marker key={location.nama_tempat} position={{ lat: Number.parseFloat(location.latitude), lng: Number.parseFloat(location.longitude) }} onClick={() => handleMarkerClick(location)} />)}

          {selectedLocation && (
            <InfoWindow
              position={{
                lat: Number.parseFloat(selectedLocation.latitude),
                lng: Number.parseFloat(selectedLocation.longitude),
              }}
              onCloseClick={() => setSelectedLocation(null)}
            >
              <div>
                <h2>{selectedLocation.nama_tempat}</h2>
                <p>{selectedLocation.alamat}</p>
                {/* You can add more details here */}
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </LoadScript>
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">Add Location</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Location</DialogTitle>
            <DialogDescription>Add a new location to the map. Click on the map to select the location.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nama_tempat" className="text-right">
                Nama Tempat
              </Label>
              <Input type="text" id="nama_tempat" name="nama_tempat" value={newLocation.nama_tempat} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="alamat" className="text-right">
                Alamat
              </Label>
              <Input type="text" id="alamat" name="alamat" value={newLocation.alamat} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="deskripsi" className="text-right">
                Deskripsi
              </Label>
              <Textarea id="deskripsi" name="deskripsi" value={newLocation.deskripsi} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="latitude" className="text-right">
                Latitude
              </Label>
              <Input type="number" id="latitude" name="latitude" value={newLocation.latitude} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="longitude" className="text-right">
                Longitude
              </Label>
              <Input type="number" id="longitude" name="longitude" value={newLocation.longitude} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="website" className="text-right">
                Website
              </Label>
              <Input type="text" id="website" name="website" value={newLocation.website} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nomor_telepon" className="text-right">
                Nomor Telepon
              </Label>
              <Input type="text" id="nomor_telepon" name="nomor_telepon" value={newLocation.nomor_telepon} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="jam_buka" className="text-right">
                Jam Buka
              </Label>
              <Input type="text" id="jam_buka" name="jam_buka" value={newLocation.jam_buka} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="jam_tutup" className="text-right">
                Jam Tutup
              </Label>
              <Input type="text" id="jam_tutup" name="jam_tutup" value={newLocation.jam_tutup} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="harga_tiket" className="text-right">
                Harga Tiket
              </Label>
              <Input type="number" id="harga_tiket" name="harga_tiket" value={newLocation.harga_tiket} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="foto_url" className="text-right">
                Foto URL
              </Label>
              <Input type="text" id="foto_url" name="foto_url" value={newLocation.foto_url} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="kategori" className="text-right">
                Kategori
              </Label>
              <Input type="text" id="kategori" name="kategori" value={newLocation.kategori} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fasilitas" className="text-right">
                Fasilitas
              </Label>
              <Input type="text" id="fasilitas" name="fasilitas" value={newLocation.fasilitas} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="aturan" className="text-right">
                Aturan
              </Label>
              <Input type="text" id="aturan" name="aturan" value={newLocation.aturan} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tips_berkunjung" className="text-right">
                Tips Berkunjung
              </Label>
              <Input type="text" id="tips_berkunjung" name="tips_berkunjung" value={newLocation.tips_berkunjung} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ulasan" className="text-right">
                Ulasan
              </Label>
              <Input type="text" id="ulasan" name="ulasan" value={newLocation.ulasan} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rating" className="text-right">
                Rating
              </Label>
              <Input type="number" id="rating" name="rating" value={newLocation.rating} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="jam_ramainya" className="text-right">
                Jam Ramainya
              </Label>
              <Input type="text" id="jam_ramainya" name="jam_ramainya" value={newLocation.jam_ramainya} onChange={handleInputChange} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleSubmit}>
              Add Location
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" role="menuitem">
            Detail Tempat Wisata
          </Button>
        </SheetTrigger>
        <SheetContent className="sm:max-w-[425px]">
          <SheetHeader>
            <SheetTitle>Detail Tempat Wisata</SheetTitle>
            <SheetDescription>Informasi detail mengenai tempat wisata.</SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nama">Nama Tempat</Label>
              <Input id="nama" value={selectedLocation?.nama_tempat} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="alamat">Alamat</Label>
              <Input id="alamat" value={selectedLocation?.alamat} className="col-span-3" />
            </div>
            <Separator />
            <p>Informasi Tambahan:</p>
            <ul>
              <li>
                • <strong>Deskripsi:</strong> {selectedLocation?.deskripsi}
              </li>
              <li>
                • <strong>Website:</strong> {selectedLocation?.website}
              </li>
              <li>
                • <strong>Nomor Telepon:</strong> {selectedLocation?.nomor_telepon}
              </li>
              <li>
                • <strong>Jam Buka:</strong> {selectedLocation?.jam_buka}
              </li>
              <li>
                • <strong>Jam Tutup:</strong> {selectedLocation?.jam_tutup}
              </li>
              <li>
                • <strong>Harga Tiket:</strong> {selectedLocation?.harga_tiket}
              </li>
              <li>
                • <strong>Kategori:</strong> {selectedLocation?.kategori}
              </li>
              <li>
                • <strong>Fasilitas:</strong> {selectedLocation?.fasilitas}
              </li>
              <li>
                • <strong>Aturan:</strong> {selectedLocation?.aturan}
              </li>
              <li>
                • <strong>Tips Berkunjung:</strong> {selectedLocation?.tips_berkunjung}
              </li>
              <li>
                • <strong>Ulasan:</strong> {selectedLocation?.ulasan}
              </li>
              <li>
                • <strong>Rating:</strong> {selectedLocation?.rating}
              </li>
              <li>
                • <strong>jam_ramainya:</strong> Format &quot;HH:MM - HH:MM&quot;
              </li>
            </ul>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default MapComponent;
