"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  sendLoginLink,
  isLoginLink,
  getStoredEmail,
  completeLoginLink,
} from "@/lib/firebaseEmailAuth";
import { Logo } from "@/components/Logo";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/dashboard";

  const [step, setStep] = useState<"email" | "sent" | "confirm" | "ready" | "completing">("email");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const completingRef = useRef(false);

  async function finishSignIn(withEmail: string) {
    if (completingRef.current) return;
    completingRef.current = true;
    setStep("completing");
    setError("");
    try {
      const credential = await completeLoginLink(withEmail, window.location.href);
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
      console.error("email link sign-in failed:", err);
      const code = (err as { code?: string })?.code;
      setError(
        code
          ? `That link didn't work (${code}). Request a new one.`
          : "That link didn't work. Request a new one."
      );
      completingRef.current = false;
      setStep("email");
    }
  }

  useEffect(() => {
    if (!isLoginLink(window.location.href)) return;

    const storedEmail = getStoredEmail();
    if (storedEmail) {
      // Don't auto-complete on page load: some spam/link-safety scanners
      // fetch (and sometimes render) email links before a human ever
      // clicks them, which can burn Firebase's single-use sign-in code
      // before the real click happens. Requiring an explicit tap here
      // means only a genuine user action can consume it.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEmail(storedEmail);
      setStep("ready");
    } else {
      // Link opened on a different device/browser than it was requested
      // from — ask them to confirm the email it was sent to.
      setStep("confirm");
    }
  }, []);

  async function onSubmitEmail(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }

    setSubmitting(true);
    try {
      await sendLoginLink(email, nextPath);
      setStep("sent");
    } catch (err) {
      console.error("sendSignInLinkToEmail failed:", err);
      const code = (err as { code?: string })?.code;
      setError(code ? `Couldn't send a link (${code}). Try again.` : "Couldn't send a link. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onSubmitConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    await finishSignIn(email);
  }

  async function onDevSkip() {
    setSubmitting(true);
    await fetch("/api/auth/dev-login", { method: "POST" });
    router.push(nextPath);
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-12">
      <div className="mb-8 flex justify-center">
        <Logo />
      </div>

      <Card>
        {step === "email" && (
          <form onSubmit={onSubmitEmail} className="space-y-4">
            <div>
              <h1 className="font-serif text-2xl text-(--color-text-primary)">Sign in</h1>
              <p className="mt-1 text-sm text-(--color-text-secondary)">
                We&apos;ll email you a sign-in link — no password needed.
              </p>
            </div>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-(--color-text-primary)">
                Email address
              </span>
              <input
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 w-full rounded-(--radius-md) border border-(--color-border) bg-white px-3 text-sm text-(--color-text-primary) focus:border-(--color-coral) focus:outline-none focus:ring-2 focus:ring-(--color-coral-soft)"
              />
            </label>
            {error && <p className="text-sm text-(--color-coral)">{error}</p>}
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Sending…" : "Send sign-in link"}
            </Button>
          </form>
        )}

        {step === "sent" && (
          <div className="space-y-3 text-center">
            <h1 className="font-serif text-2xl text-(--color-text-primary)">Check your email</h1>
            <p className="text-sm text-(--color-text-secondary)">
              We sent a sign-in link to <span className="font-medium">{email}</span>. Open it on
              this device to finish signing in.
            </p>
            <button
              type="button"
              onClick={() => setStep("email")}
              className="text-sm text-(--color-coral) hover:text-(--color-coral-hover)"
            >
              Use a different email
            </button>
          </div>
        )}

        {step === "confirm" && (
          <form onSubmit={onSubmitConfirm} className="space-y-4">
            <div>
              <h1 className="font-serif text-2xl text-(--color-text-primary)">Confirm your email</h1>
              <p className="mt-1 text-sm text-(--color-text-secondary)">
                This link was opened in a different browser than it was requested from — enter
                your email to finish signing in.
              </p>
            </div>
            <input
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 w-full rounded-(--radius-md) border border-(--color-border) bg-white px-3 text-sm text-(--color-text-primary) focus:border-(--color-coral) focus:outline-none focus:ring-2 focus:ring-(--color-coral-soft)"
            />
            {error && <p className="text-sm text-(--color-coral)">{error}</p>}
            <Button type="submit" className="w-full">
              Continue
            </Button>
          </form>
        )}

        {step === "ready" && (
          <div className="space-y-4 text-center">
            <div>
              <h1 className="font-serif text-2xl text-(--color-text-primary)">Almost there</h1>
              <p className="mt-1 text-sm text-(--color-text-secondary)">
                Confirm sign-in as <span className="font-medium">{email}</span>.
              </p>
            </div>
            {error && <p className="text-sm text-(--color-coral)">{error}</p>}
            <Button onClick={() => finishSignIn(email)} className="w-full">
              Finish signing in
            </Button>
          </div>
        )}

        {step === "completing" && (
          <div className="space-y-2 text-center">
            <p className="text-sm text-(--color-text-secondary)">Signing you in…</p>
          </div>
        )}
      </Card>

      {process.env.NODE_ENV !== "production" && (
        <button
          onClick={onDevSkip}
          disabled={submitting}
          className="mt-4 text-center text-xs text-(--color-text-muted) hover:text-(--color-coral)"
        >
          Skip email login (dev only)
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
