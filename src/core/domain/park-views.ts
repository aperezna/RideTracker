import type { ParkStatus, RideCategory } from "@/core/db/schema";

export type ParkCardData = {
  id: string;
  name: string;
  country: string;
  city: string;
  status: ParkStatus;
  tripNotes: string;
  rideCount: number;
};

export type RideInventoryData = {
  id: string;
  name: string;
  category: RideCategory;
  manufacturer: string;
  rating: number | null;
  preferredRow: string | null;
  totalLaps: number;
};

export type VisitHistoryData = {
  id: string;
  visitDate: string;
  tripNotes: string | null;
  totalLaps: number;
  rideCount: number;
};

export type ParkDetailData = ParkCardData & {
  externalId: string | null;
  latitude: number;
  longitude: number;
  rides: RideInventoryData[];
  visits: VisitHistoryData[];
};
