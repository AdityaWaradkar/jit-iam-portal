"use client";

import type { IssueCredentialResponse } from "./api";

type Listener = () => void;

let latest: IssueCredentialResponse | null = null;
const listeners = new Set<Listener>();

export function setLatestCredential(
  credential: IssueCredentialResponse,
): void {
  latest = credential;
  for (const listener of listeners) listener();
}

export function getLatestCredential(): IssueCredentialResponse | null {
  return latest;
}

export function clearLatestCredential(): void {
  latest = null;
  for (const listener of listeners) listener();
}

export function subscribeLatestCredential(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}