"use client";

import { useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RecaptchaVerifier, signInWithPhoneNumberShim } from "@/lib/firebasePhoneAuth";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { Logo } from "@/components/Logo";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/dashboard";

  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [recaptchaKey, setRecaptchaKey] = useState(0);
  const confirmationRef = useRef<import("firebase/auth").ConfirmationResult | null>(null);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);

  async function onDevSkip() {
    setSubmitting(true);
    await fetch("/api/auth/dev-login", { method: "POST" });
    router.push(nextPath);
    router.refresh();
  }

  async function onSubmitPhone(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const parsed = parsePhoneNumberFromString(phone, "US");
    if (!parsed?.isValid()) {
      setError("Enter a valid phone number.");
      return;
    }

    setSubmitting(true);
    try {
      confirmationRef.current = await signInWithPhoneNumberShim(
        parsed.number,
        recaptchaRef,
        "recaptcha-container"
      );
      setStep("code");
    } catch (err) {
      console.error("signInWithPhoneNumber failed:", err);
      const code = (err as { code?: string })?.code;
      setError(
        code
          ? `Couldn't send a code (${code}). Try again.`
          : "Couldn't send a code to that number. Try again."
      );
      // Force a fresh DOM node for reCAPTCHA to render into next attempt —
      // Firebase's clear() alone can leave stale widget markup behind,
      // which crashes the *next* render into the same container.
      setRecaptchaKey((k) => k + 1);
    } finally {
      setSubmitting(false);
    }
  }

  async function onSubmitCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!confirmationRef.current) {
      setError("Session expired — request a new code.");
      setStep("phone");
      return;
    }

    setSubmitting(true);
    try {
      const credential = await confirmationRef.current.confirm(code);
      const idToken = await credential.user.getIdToken();

      const res = await fetch("/api/auth/verify-firebase-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!res.ok) throw new Error("verify failed");
      router.push(nextPath);
      router.refresh();
    } catch (err) {
      console.error("code verification failed:", err);
      const code = (err as { code?: string })?.code;
      setError(code ? `That code didn't work (${code}).` : "That code didn't work. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-12">
      <div className="mb-8 flex justify-center">
        <Logo />
      </div>

      <Card>
        {step === "phone" ? (
          <form onSubmit={onSubmitPhone} className="space-y-4">
            <div>
              <h1 className="font-serif text-2xl text-(--color-text-primary)">Sign in</h1>
              <p className="mt-1 text-sm text-(--color-text-secondary)">
                We&apos;ll text you a one-time code.
              </p>
            </div>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-(--color-text-primary)">
                Phone number
              </span>
              <input
                type="tel"
                autoComplete="tel"
                placeholder="(555) 123-4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-11 w-full rounded-(--radius-md) border border-(--color-border) bg-white px-3 text-sm text-(--color-text-primary) focus:border-(--color-coral) focus:outline-none focus:ring-2 focus:ring-(--color-coral-soft)"
              />
            </label>
            {error && <p className="text-sm text-(--color-coral)">{error}</p>}
            <div key={recaptchaKey} id="recaptcha-container" />
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Sending…" : "Send code"}
            </Button>
          </form>
        ) : (
          <form onSubmit={onSubmitCode} className="space-y-4">
            <div>
              <h1 className="font-serif text-2xl text-(--color-text-primary)">Enter code</h1>
              <p className="mt-1 text-sm text-(--color-text-secondary)">
                Sent to {phone}.{" "}
                <button
                  type="button"
                  onClick={() => setStep("phone")}
                  className="text-(--color-coral) hover:text-(--color-coral-hover)"
                >
                  Change
                </button>
              </p>
            </div>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-(--color-text-primary)">
                6-digit code
              </span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="h-11 w-full rounded-(--radius-md) border border-(--color-border) bg-white px-3 text-center text-lg tracking-[0.5em] text-(--color-text-primary) focus:border-(--color-coral) focus:outline-none focus:ring-2 focus:ring-(--color-coral-soft)"
              />
            </label>
            {error && <p className="text-sm text-(--color-coral)">{error}</p>}
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Verifying…" : "Verify & sign in"}
            </Button>
          </form>
        )}
      </Card>

      {process.env.NODE_ENV !== "production" && (
        <button
          onClick={onDevSkip}
          disabled={submitting}
          className="mt-4 text-center text-xs text-(--color-text-muted) hover:text-(--color-coral)"
        >
          Skip phone login (dev only)
        </button>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
