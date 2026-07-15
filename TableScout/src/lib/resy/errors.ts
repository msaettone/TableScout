export type ResyErrorCode = "SLOT_TAKEN" | "AUTH_EXPIRED" | "RATE_LIMITED" | "UNKNOWN";

export class ResyError extends Error {
  code: ResyErrorCode;

  constructor(code: ResyErrorCode, message: string) {
    super(message);
    this.name = "ResyError";
    this.code = code;
  }
}

export function classifyResyHttpError(status: number, body: string): ResyError {
  if (status === 401 || status === 403) {
    return new ResyError("AUTH_EXPIRED", "Resy session expired — reconnect your account.");
  }
  if (status === 429) {
    return new ResyError("RATE_LIMITED", "Resy is rate-limiting this account right now.");
  }
  if (status === 400 && /sold.?out|no longer available|already booked/i.test(body)) {
    return new ResyError("SLOT_TAKEN", "That table was just booked by someone else.");
  }
  return new ResyError("UNKNOWN", `Resy request failed (${status}): ${body.slice(0, 200)}`);
}
