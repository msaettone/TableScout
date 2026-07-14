import type { Restaurant, WatchStatus } from "@prisma/client";

export type WatchWithRestaurant = {
  id: string;
  userId: string;
  restaurantId: string;
  restaurant: Restaurant;
  targetDate: string;
  partySize: number;
  preferredTimes: string[];
  releaseAt: string;
  status: WatchStatus;
  confirmedTime: string | null;
  createdAt: string;
  updatedAt: string;
};
