export interface BookingInputItem {
  id: string;
  weightKg: number;
  volumeM3: number;
  length?: number;
  width?: number;
  height?: number;
}

export interface BookingInputPool {
  id: string;
  mode: 'sea' | 'air';
  originPort: string;
  destPort: string;
  cutoffAt: Date;
  capacityM3: number;
  usedM3: number;
}

export interface BookingRequest {
  pool: BookingInputPool;
  items: BookingInputItem[];
}

export interface BookingResult {
  bookingRef: string;
  carrier: string;
  mode: 'sea' | 'air';
  etdISO?: string;
}

export interface BookingProvider {
  book(req: BookingRequest): Promise<BookingResult>;
}
