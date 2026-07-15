// Shapes confirmed against real Resy responses during the Phase 0 spike
// (see project memory for details). Only the fields we actually use are
// typed — Resy's real responses include much more.

export type ResyVenueHit = {
  id: { resy: number };
  name: string;
  neighborhood?: string;
  cuisine?: string[];
  price_range_id?: number;
  location?: { name?: string };
};

export type ResySearchResponse = {
  search?: { hits?: ResyVenueHit[] };
};

export type ResySlot = {
  config: { id: number; token: string; type: string };
  date: { start: string; end: string };
};

export type ResyFindResponse = {
  results?: {
    venues?: Array<{
      venue: { id: { resy: number }; name: string };
      slots?: ResySlot[];
    }>;
  };
};

export type ResyDetailsResponse = {
  payment?: {
    config?: { type: string };
  };
  book_token?: { value: string; date_expires: string };
};

export type ResyBookResponse = {
  resy_token?: string;
  reservation_id?: string | number;
};
