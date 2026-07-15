"use client";

import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebaseClient";

export { RecaptchaVerifier };

export async function signInWithPhoneNumberShim(
  e164Phone: string,
  recaptchaRef: React.MutableRefObject<RecaptchaVerifier | null>,
  containerId: string
) {
  if (!recaptchaRef.current) {
    recaptchaRef.current = new RecaptchaVerifier(firebaseAuth, containerId, {
      size: "invisible",
    });
  }

  try {
    return await signInWithPhoneNumber(firebaseAuth, e164Phone, recaptchaRef.current);
  } catch (err) {
    // Invisible reCAPTCHA is single-use — a failed attempt leaves the verifier
    // spent, and reusing it on retry crashes deep inside Google's script
    // instead of surfacing a real error. Tear it down so the next attempt
    // gets a fresh one.
    recaptchaRef.current.clear();
    recaptchaRef.current = null;
    throw err;
  }
}
