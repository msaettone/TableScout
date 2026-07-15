import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserOrResponse } from "@/lib/auth";
import { searchVenues } from "@/lib/resy/client";
import { getDecryptedResyToken } from "@/lib/resy/userAuth";
import { ResyError } from "@/lib/resy/errors";

const PRICE_SYMBOLS = ["$", "$$", "$$$", "$$$$"];

export async function GET(req: NextRequest) {
  const auth = await requireUserOrResponse();
  if ("response" in auth) return auth.response;
  const { user } = auth;

  const query = req.nextUrl.searchParams.get("q")?.trim();
  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }

  let authToken: string;
  try {
    authToken = getDecryptedResyToken(user);
  } catch (err) {
    if (err instanceof ResyError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: 400 });
    }
    throw err;
  }

  try {
    const hits = await searchVenues(query, authToken);

    const restaurants = await Promise.all(
      hits.slice(0, 8).map((hit) =>
        prisma.restaurant.upsert({
          where: { resyVenueId: String(hit.id.resy) },
          update: { name: hit.name },
          create: {
            name: hit.name,
            resyVenueId: String(hit.id.resy),
            cuisine: hit.cuisine?.[0] ?? "Restaurant",
            neighborhood: hit.neighborhood ?? hit.location?.name ?? "",
            priceRange: PRICE_SYMBOLS[(hit.price_range_id ?? 1) - 1] ?? "$$",
          },
        })
      )
    );

    return NextResponse.json(restaurants);
  } catch (err) {
    if (err instanceof ResyError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: 502 });
    }
    throw err;
  }
}
