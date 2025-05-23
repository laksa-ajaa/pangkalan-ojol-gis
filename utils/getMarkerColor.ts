/**
 * Returns the appropriate Tailwind color class based on the kepadatan (density) value
 * @param kepadatan - The density value (1-5)
 * @returns The Tailwind color class
 */
export function getMarkerColor(kepadatan: number): string {
  switch (kepadatan) {
    case 5:
      return "text-red-500";
    case 4:
      return "text-orange-500";
    case 3:
      return "text-yellow-500";
    case 2:
      return "text-green-500";
    case 1:
      return "text-blue-500";
    default:
      return "text-gray-500";
  }
}
