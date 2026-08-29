export interface PropertyUnit {
  id: string;
  property_id: string;
  name: string;
  created_at?: string;
}

export interface Property {
  id: string;
  title: string;
  slug?: string;
  property_type: 'house' | 'room';
  price_per_night: number;
  max_guests: number;
  distance_to_sea: number;
  address: string;
  description?: string;
  amenities?: string[];
  photos?: string[];
  landlord_phone: string;
  is_active: boolean;
  units?: PropertyUnit[];
  rating?: number;
  reviews_count?: number;
  min_nights?: number;
  created_at?: string;
}