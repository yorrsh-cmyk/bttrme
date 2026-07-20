"use client";

import { useActionState } from "react";
import { login, type LoginFormState } from "@/server/actions/auth";
import type { Language } from "@/i18n/catalog";

interface LoginFormProps {
  language: Language;
  next: string | null;
  copy: {
    title: string;
    username: string;
    password: string;
    submit: string;
  };
}

const initialState: LoginFormState = { error: null };

export function LoginForm({ language, next, copy }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <h2 className="sr-only">{copy.title}</h2>
      <input type="hidden" name="language" value={language} />
      {next ? <input type="hidden" name="next" value={next} /> : null}

      <label className="flex flex-col gap-1">
        <span className="text-sm opacity-70">{copy.username}</span>
        <input
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          required
          className="rounded-lg border border-gray-300 bg-white px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm opacity-70">{copy.password}</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="rounded-lg border border-gray-300 bg-white px-3 py-2"
        />
      </label>

      {state.error ? (
        // Neutral tone, neutral color — never red (Phase 1 §3).
        <p role="status" className="text-sm opacity-80">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-gray-900 px-4 py-2.5 font-medium text-white disabled:opacity-50"
      >
        {copy.submit}
      </button>
    </form>
  );
}
