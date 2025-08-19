export interface SchedulePickupRequest {
  pickup: {
    id: string;
    userId: string;
    contactName: string;
    phone?: string | null;
    email?: string | null;
    address1: string;
    address2?: string | null;
    city: string;
    state?: string | null;
    postcode: string;
    country: string;
    windowStartAt: Date;
    windowEndAt: Date;
    pieces: number;
    totalWeightKg: number;
    notes?: string | null;
  };
}

export interface SchedulePickupResult {
  carrierRef: string;
  labelUrl?: string;
  scheduled: boolean;
}

export interface PickupProvider {
  schedule(req: SchedulePickupRequest): Promise<SchedulePickupResult>;
}
