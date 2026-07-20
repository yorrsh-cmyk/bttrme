import { hash, verify } from "@node-rs/argon2";

// OWASP-recommended argon2id parameters (plan §4): 19 MiB memory, t=2, p=1.
// Shared by the login action and the seed/set-password scripts.
export const ARGON2_OPTIONS = {
  memoryCost: 19 * 1024,
  timeCost: 2,
  parallelism: 1,
} as const;

export function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2_OPTIONS);
}

export function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  return verify(passwordHash, password);
}
