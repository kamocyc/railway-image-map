import { StationMapping } from "./StationMapping";

export interface Report {
  id: string;
  mappingId: number;
  reporterId: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'rejected';
  createdAt?: string;
  stationMapping?: StationMapping;
  reporterEmail?: string;
}