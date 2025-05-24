// Define the expected structure for our GeoJSON properties
interface ExpectedProperties {
  nama_lokasi: string;
  jenis_lokasi: string;
  jam_ramainya: string;
  tingkat_kepadatan: number;
  tingkat_keamanan: number;
  akses_internet: number;
  kenyamanan: number;
  fasilitas: string;
  alamat: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// List of allowed location types
const ALLOWED_LOCATION_TYPES = ["Terminal", "Minimarket", "Perumahan", "Mall", "Stasiun", "Pinggir jalan", "Universitas", "Mesjid", "SPBU", "Sekolah", "Bank", "Warkop", "Cafe"];

export function validateGeoJSON(data: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if data exists
  if (!data) {
    errors.push("File kosong atau tidak dapat dibaca");
    return { isValid: false, errors, warnings };
  }

  // Check basic GeoJSON structure
  if (typeof data !== "object") {
    errors.push("File harus berupa objek JSON yang valid");
    return { isValid: false, errors, warnings };
  }

  // Check type property
  if (data.type !== "FeatureCollection") {
    errors.push("GeoJSON harus bertipe 'FeatureCollection'");
    return { isValid: false, errors, warnings };
  }

  // Check features array
  if (!Array.isArray(data.features)) {
    errors.push("Property 'features' harus berupa array");
    return { isValid: false, errors, warnings };
  }

  if (data.features.length === 0) {
    errors.push("File GeoJSON tidak boleh kosong (minimal 1 feature)");
    return { isValid: false, errors, warnings };
  }

  if (data.features.length > 1000) {
    warnings.push(`File berisi ${data.features.length} lokasi. Performa mungkin terpengaruh untuk data yang sangat besar.`);
  }

  // Validate each feature
  data.features.forEach((feature: any, index: number) => {
    const featureErrors = validateFeature(feature, index);
    errors.push(...featureErrors);
  });

  // Check for duplicate locations
  const duplicates = findDuplicateLocations(data.features);
  if (duplicates.length > 0) {
    warnings.push(`Ditemukan ${duplicates.length} lokasi dengan nama yang sama: ${duplicates.slice(0, 3).join(", ")}${duplicates.length > 3 ? "..." : ""}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

function validateFeature(feature: any, index: number): string[] {
  const errors: string[] = [];
  const featurePrefix = `Feature ${index + 1}`;

  // Check feature type
  if (feature.type !== "Feature") {
    errors.push(`${featurePrefix}: type harus 'Feature'`);
    return errors;
  }

  // Check geometry
  const geometryErrors = validateGeometry(feature.geometry, featurePrefix);
  errors.push(...geometryErrors);

  // Check properties
  const propertiesErrors = validateProperties(feature.properties, featurePrefix);
  errors.push(...propertiesErrors);

  return errors;
}

function validateGeometry(geometry: any, featurePrefix: string): string[] {
  const errors: string[] = [];

  if (!geometry) {
    errors.push(`${featurePrefix}: geometry tidak boleh kosong`);
    return errors;
  }

  if (geometry.type !== "Point") {
    errors.push(`${featurePrefix}: geometry type harus 'Point'`);
    return errors;
  }

  if (!Array.isArray(geometry.coordinates)) {
    errors.push(`${featurePrefix}: coordinates harus berupa array`);
    return errors;
  }

  if (geometry.coordinates.length !== 2) {
    errors.push(`${featurePrefix}: coordinates harus berisi 2 elemen [longitude, latitude]`);
    return errors;
  }

  const [lng, lat] = geometry.coordinates;

  // Validate longitude
  if (typeof lng !== "number" || isNaN(lng)) {
    errors.push(`${featurePrefix}: longitude harus berupa angka`);
  } else if (lng < -180 || lng > 180) {
    errors.push(`${featurePrefix}: longitude harus antara -180 dan 180`);
  }

  // Validate latitude
  if (typeof lat !== "number" || isNaN(lat)) {
    errors.push(`${featurePrefix}: latitude harus berupa angka`);
  } else if (lat < -90 || lat > 90) {
    errors.push(`${featurePrefix}: latitude harus antara -90 dan 90`);
  }

  // Check if coordinates are in Indonesia region (rough bounds)
  if (typeof lng === "number" && typeof lat === "number" && !isNaN(lng) && !isNaN(lat)) {
    if (lng < 95 || lng > 141 || lat < -11 || lat > 6) {
      errors.push(`${featurePrefix}: koordinat berada di luar wilayah Indonesia`);
    }
  }

  return errors;
}

function validateProperties(properties: any, featurePrefix: string): string[] {
  const errors: string[] = [];

  if (!properties || typeof properties !== "object") {
    errors.push(`${featurePrefix}: properties harus berupa objek`);
    return errors;
  }

  // Required string fields
  const requiredStringFields = ["nama_lokasi", "jenis_lokasi", "jam_ramainya", "fasilitas", "alamat"];

  requiredStringFields.forEach((field) => {
    if (!properties[field]) {
      errors.push(`${featurePrefix}: ${field} tidak boleh kosong`);
    } else if (typeof properties[field] !== "string") {
      errors.push(`${featurePrefix}: ${field} harus berupa teks`);
    } else if (properties[field].trim().length === 0) {
      errors.push(`${featurePrefix}: ${field} tidak boleh kosong`);
    }
  });

  // Validate jenis_lokasi against allowed types
  if (properties.jenis_lokasi && typeof properties.jenis_lokasi === "string") {
    if (!ALLOWED_LOCATION_TYPES.includes(properties.jenis_lokasi)) {
      errors.push(`${featurePrefix}: jenis_lokasi '${properties.jenis_lokasi}' tidak valid. Jenis yang diizinkan: ${ALLOWED_LOCATION_TYPES.join(", ")}`);
    }
  }

  // Required number fields (1-5 rating)
  const requiredNumberFields = ["tingkat_kepadatan", "tingkat_keamanan", "akses_internet", "kenyamanan"];

  requiredNumberFields.forEach((field) => {
    if (properties[field] === undefined || properties[field] === null) {
      errors.push(`${featurePrefix}: ${field} tidak boleh kosong`);
    } else if (typeof properties[field] !== "number" || isNaN(properties[field])) {
      errors.push(`${featurePrefix}: ${field} harus berupa angka`);
    } else if (!Number.isInteger(properties[field])) {
      errors.push(`${featurePrefix}: ${field} harus berupa bilangan bulat`);
    } else if (properties[field] < 1 || properties[field] > 5) {
      errors.push(`${featurePrefix}: ${field} harus antara 1-5`);
    }
  });

  // Validate specific field formats
  if (properties.nama_lokasi && typeof properties.nama_lokasi === "string") {
    if (properties.nama_lokasi.length > 100) {
      errors.push(`${featurePrefix}: nama_lokasi terlalu panjang (maksimal 100 karakter)`);
    }
  }

  if (properties.alamat && typeof properties.alamat === "string") {
    if (properties.alamat.length > 200) {
      errors.push(`${featurePrefix}: alamat terlalu panjang (maksimal 200 karakter)`);
    }
  }

  if (properties.jam_ramainya && typeof properties.jam_ramainya === "string") {
    // Basic time format validation (HH:MM - HH:MM)
    const timePattern = /^(\d{2}:\d{2}\s*-\s*\d{2}:\d{2})(\s*&\s*\d{2}:\d{2}\s*-\s*\d{2}:\d{2})*$/;
    if (!timePattern.test(properties.jam_ramainya)) {
      errors.push(`${featurePrefix}: format jam_ramainya tidak valid. Contoh: "06:00 - 10:00" atau "06:00 - 10:00 & 16:00 - 20:00"`);
    }
  }

  return errors;
}

function findDuplicateLocations(features: any[]): string[] {
  const locationNames = features.map((f) => f.properties?.nama_lokasi).filter((name) => typeof name === "string");

  const duplicates = locationNames.filter((name, index) => locationNames.indexOf(name) !== index);

  return [...new Set(duplicates)];
}

// Additional utility function to sanitize data
export function sanitizeGeoJSON(data: any): any {
  if (!data || !data.features) return data;

  const sanitizedFeatures = data.features.map((feature: any) => {
    if (!feature.properties) return feature;

    const sanitizedProperties = { ...feature.properties };

    // Trim string fields
    const stringFields = ["nama_lokasi", "jenis_lokasi", "jam_ramainya", "fasilitas", "alamat"];
    stringFields.forEach((field) => {
      if (typeof sanitizedProperties[field] === "string") {
        sanitizedProperties[field] = sanitizedProperties[field].trim();
      }
    });

    // Ensure number fields are integers
    const numberFields = ["tingkat_kepadatan", "tingkat_keamanan", "akses_internet", "kenyamanan"];
    numberFields.forEach((field) => {
      if (typeof sanitizedProperties[field] === "number") {
        sanitizedProperties[field] = Math.round(sanitizedProperties[field]);
        // Clamp values between 1-5
        sanitizedProperties[field] = Math.max(1, Math.min(5, sanitizedProperties[field]));
      }
    });

    return {
      ...feature,
      properties: sanitizedProperties,
    };
  });

  return {
    ...data,
    features: sanitizedFeatures,
  };
}

// Function to generate a sample GeoJSON for download
export function generateSampleGeoJSON(): string {
  const sampleData = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {
          nama_lokasi: "Contoh Terminal Bus",
          jenis_lokasi: "Terminal",
          jam_ramainya: "06:00 - 10:00 & 16:00 - 20:00",
          tingkat_kepadatan: 5,
          tingkat_keamanan: 4,
          akses_internet: 3,
          kenyamanan: 4,
          fasilitas: "Tempat duduk, warung, toilet, mushola",
          alamat: "Jl. Contoh No.1, Jakarta Pusat",
        },
        geometry: {
          type: "Point",
          coordinates: [106.8456, -6.2088],
        },
      },
      {
        type: "Feature",
        properties: {
          nama_lokasi: "Contoh Minimarket",
          jenis_lokasi: "Minimarket",
          jam_ramainya: "07:00 - 09:00 & 17:00 - 19:00",
          tingkat_kepadatan: 3,
          tingkat_keamanan: 4,
          akses_internet: 4,
          kenyamanan: 3,
          fasilitas: "Tempat duduk, ATM",
          alamat: "Jl. Contoh No.2, Jakarta Selatan",
        },
        geometry: {
          type: "Point",
          coordinates: [106.82, -6.25],
        },
      },
    ],
  };

  return JSON.stringify(sampleData, null, 2);
}
