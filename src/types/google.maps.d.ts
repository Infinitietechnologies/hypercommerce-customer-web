/// <reference types="google.maps" />

declare global {
  interface Window {
    google: typeof google;
    googleMapsLoading?: boolean;
    googleMapsUnavailable?: boolean;
  }
}

export {};
