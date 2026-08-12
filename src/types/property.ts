export interface Property {
    id: string;
    title: string;
    slug: string;
    property_type: 'house' | 'room' | 'cottage';
    price_per_night: number;
    max_guests: number;
    distance_to_sea: number;
    address: string;
    description: string;
    amenities: string[];
    photos: string[];
    is_active: boolean;
    landlord_phone?: string;
  }