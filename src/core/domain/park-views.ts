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
  externalId: string | null;
  name: string;
  category: RideCategory;
  manufacturer: string;
  photoUrl: string | null;
  photoSourceUrl: string | null;
  rating: number | null;
  preferredRow: string | null;
  totalLaps: number;
  totalTrips: number;
};

export type RideDetailData = RideInventoryData & {
  parkId: string;
  parkName: string;
  parkCountry: string;
  parkCity: string;
  externalId: string | null;
  reviewNotes: string | null;
  experience: string | null;
  storytelling: string | null;
  fieldSources: Array<{ field: string; source: string; sourceUrl: string | null }>;
  aliases: string[];
  manualFields: string[];
};

export type VisitHistoryData = {
  id: string;
  visitDate: string;
  tripNotes: string | null;
  durationMinutes: number | null;
  weather: string | null;
  company: string | null;
  overallRating: number | null;
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

export type VisitRideData = {
  id: string;
  name: string;
  category: RideCategory;
  preferredRow: string | null;
  rating: number | null;
  lapCount: number;
  checkInCount: number;
  reviewNotes: string | null;
};

export type VisitDayData = {
  id: string;
  parkId: string;
  parkName: string;
  city: string;
  country: string;
  visitDate: string;
  tripNotes: string | null;
  durationMinutes: number | null;
  weather: string | null;
  company: string | null;
  overallRating: number | null;
  rides: VisitRideData[];
};
