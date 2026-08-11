export const INTRO_DURATION_MS = 1700;

export type LaunchState = "intro" | "checking-auth" | "sign-in" | "app";

export function getLaunchState(
  introComplete: boolean,
  authLoading: boolean,
  isAuthenticated: boolean
): LaunchState {
  if (!introComplete) return "intro";
  if (authLoading) return "checking-auth";
  return isAuthenticated ? "app" : "sign-in";
}
