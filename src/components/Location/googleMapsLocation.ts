export const GOOGLE_MAPS_UNAVAILABLE_EVENT =
  "hypercommerce:google-maps-unavailable";

export function reverseGeocodeLocation(
  location: google.maps.LatLngLiteral,
): Promise<google.maps.GeocoderResult[]> {
  if (window.googleMapsUnavailable) return Promise.resolve([]);

  return new Promise((resolve) => {
    let settled = false;
    const finish = (results: google.maps.GeocoderResult[] = []) => {
      if (settled) return;
      settled = true;
      clearTimeout(deadline);
      clearInterval(bootstrap);
      window.removeEventListener(GOOGLE_MAPS_UNAVAILABLE_EVENT, fail);
      resolve(results);
    };
    const fail = () => finish();
    const lookup = async () => {
      if (typeof window.google?.maps?.importLibrary !== "function") return;
      clearInterval(bootstrap);
      try {
        const { Geocoder } = (await window.google.maps.importLibrary(
          "geocoding",
        )) as google.maps.GeocodingLibrary;
        if (settled) return;
        const { results } = await new Geocoder().geocode({ location });
        finish(results);
      } catch {
        fail();
      }
    };
    const deadline = setTimeout(fail, 8000);
    const bootstrap = setInterval(lookup, 100);
    window.addEventListener(GOOGLE_MAPS_UNAVAILABLE_EVENT, fail);
    void lookup();
  });
}
