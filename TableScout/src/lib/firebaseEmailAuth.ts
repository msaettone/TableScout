"use client";

import {
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  type ActionCodeSettings,
} from "firebase/auth";
import { firebaseAuth } from "@/lib/firebaseClient";

// Firebase's email-link ("magic link") sign-in — genuinely free, no Cloud
// Billing account required (unlike Phone Auth SMS, which now hard-requires
// Blaze — see login/page.tsx for why this replaced phone login).
const STORAGE_KEY = "tablescout:emailForSignIn";

export async function sendLoginLink(email: string, redirectPath: string) {
  const actionCodeSettings: ActionCodeSettings = {
    url: `${window.location.origin}/login?next=${encodeURIComponent(redirectPath)}`,
    handleCodeInApp: true,
  };
  await sendSignInLinkToEmail(firebaseAuth, email, actionCodeSettings);
  window.localStorage.setItem(STORAGE_KEY, email);
}

export function isLoginLink(url: string) {
  return isSignInWithEmailLink(firebaseAuth, url);
}

export function getStoredEmail() {
  return window.localStorage.getItem(STORAGE_KEY);
}

export async function completeLoginLink(email: string, url: string) {
  const credential = await signInWithEmailLink(firebaseAuth, email, url);
  window.localStorage.removeItem(STORAGE_KEY);
  return credential;
}
