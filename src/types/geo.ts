// Geo directory (country / city / pincode) lookups used by the address flow.
// Backed by the panel's /geo/* endpoints. See src/services/geo.ts.

// One row from GET /geo/countries. `type` decides how a country is searched:
//  - "city"    → user searches a city; state + country come back with it.
//  - "zipcode" → user searches a pincode; state + city list come back with it.
export interface GeoCountry {
  iso2: string;
  name: string;
  type: "city" | "zipcode";
}

// One row from GET /geo/cities?country=&search=
export interface GeoCity {
  name: string;
  state_code: string;
  state_name: string | null;
  country_iso2: string;
  country_name: string;
}

// GET /geo/resolve-pincode?country=&pincode= — a single pincode can span
// several cities in the same state, so `cities` is a list to pick from.
export interface PincodeResolution {
  country_iso2: string;
  country_name: string;
  state_code: string;
  state_name: string;
  cities: string[];
}
