// Delivery Zone
export interface BoundaryPoint {
  lat: number;
  lng: number;
}

export interface DeliveryZone {
  id: number;
  zone_id: number;
  name: string;
  slug: string;
  center_latitude: string;
  center_longitude: string;
  radius_km: number;
  boundary_json: BoundaryPoint[];
  rush_delivery_enabled: boolean;
  delivery_time_per_km: number;
  rush_delivery_time_per_km: number;
  rush_delivery_charges: number;
  regular_delivery_charges: number;
  free_delivery_amount: number | null;
  distance_based_delivery_charges: number;
  per_store_drop_off_fee: number;
  handling_charges: number;
  buffer_time: number;
  status: "active" | "inactive" | string;
  delivery_boy_base_fee: string;
  delivery_boy_per_store_pickup_fee: string;
  delivery_boy_distance_based_fee: string;
  delivery_boy_per_order_incentive: string;
  created_at: string;
  updated_at: string;
}
