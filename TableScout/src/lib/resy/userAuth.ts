import { decrypt } from "@/lib/crypto";
import { ResyError } from "@/lib/resy/errors";
import type { User } from "@prisma/client";

export function getDecryptedResyToken(user: User): string {
  if (!user.resyAuthTokenEnc) {
    throw new ResyError("AUTH_EXPIRED", "Connect your Resy account in Settings first.");
  }
  return decrypt(user.resyAuthTokenEnc);
}
