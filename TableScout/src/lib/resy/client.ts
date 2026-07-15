import { classifyResyHttpError } from "@/lib/resy/errors";
import type {
  ResyBookResponse,
  ResyDetailsResponse,
  ResyFindResponse,
  ResySearchResponse,
  ResySlot,
  ResyVenueHit,
} from "@/lib/resy/types";

const BASE_URL = "https://api.resy.com";

function headers(authToken: string) {
  return {
    authorization: `ResyAPI api_key="${process.env.RESY_API_KEY}"`,
    "x-resy-auth-token": authToken,
    "x-resy-universal-auth": authToken,
    "content-type": "application/json",
    origin: "https://resy.com",
    referer: "https://resy.com/",
    "user-agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  };
}

async function resyFetch<T>(url: string, authToken: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { ...headers(authToken), ...init?.headers },
  });
  if (!res.ok) {
    throw classifyResyHttpError(res.status, await res.text());
  }
  return res.json();
}

export async function searchVenues(query: string, authToken: string): Promise<ResyVenueHit[]> {
  const data = await resyFetch<ResySearchResponse>(`${BASE_URL}/3/venuesearch/search`, authToken, {
    method: "POST",
    body: JSON.stringify({
      geo: { latitude: 40.7128, longitude: -74.006 },
      query,
      types: ["venue"],
    }),
  });
  return data.search?.hits ?? [];
}

export async function getAvailability(params: {
  authToken: string;
  resyVenueId: number;
  day: string; // YYYY-MM-DD
  partySize: number;
}): Promise<ResySlot[]> {
  const url = new URL(`${BASE_URL}/4/find`);
  url.searchParams.set("lat", "0");
  url.searchParams.set("long", "0");
  url.searchParams.set("day", params.day);
  url.searchParams.set("party_size", String(params.partySize));
  url.searchParams.set("venue_id", String(params.resyVenueId));

  const data = await resyFetch<ResyFindResponse>(url.toString(), params.authToken);
  return data.results?.venues?.[0]?.slots ?? [];
}

/** Picks the earliest slot matching a preferred time (HH:mm), in preference order. */
export function matchPreferredSlot(slots: ResySlot[], preferredTimes: string[]): ResySlot | null {
  for (const time of preferredTimes) {
    const match = slots.find((s) => s.date.start.slice(11, 16) === time);
    if (match) return match;
  }
  return null;
}

export async function getBookingToken(params: {
  authToken: string;
  configToken: string;
  day: string;
  partySize: number;
}): Promise<{ bookToken: string; expiresAt: Date; paymentType: string }> {
  const url = new URL(`${BASE_URL}/3/details`);
  url.searchParams.set("config_id", params.configToken);
  url.searchParams.set("day", params.day);
  url.searchParams.set("party_size", String(params.partySize));

  const data = await resyFetch<ResyDetailsResponse>(url.toString(), params.authToken);
  if (!data.book_token) {
    throw classifyResyHttpError(400, "no booking token returned — slot likely no longer available");
  }
  return {
    bookToken: data.book_token.value,
    expiresAt: new Date(data.book_token.date_expires),
    paymentType: data.payment?.config?.type ?? "unknown",
  };
}

export async function book(params: {
  authToken: string;
  bookToken: string;
}): Promise<{ reservationId: string }> {
  const data = await resyFetch<ResyBookResponse>(`${BASE_URL}/3/book`, params.authToken, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ book_token: params.bookToken }).toString(),
  });
  return { reservationId: String(data.reservation_id ?? data.resy_token ?? "") };
}
