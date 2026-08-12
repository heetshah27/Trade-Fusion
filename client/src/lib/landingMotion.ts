export const dashboardReveal = {
  hidden: { opacity: 0, y: 48, scale: 0.975 },
  visible: { opacity: 1, y: 0, scale: 1 },
} as const;

export function shouldRunLandingMotion(reducedMotion: boolean | null, inView: boolean) {
  return !reducedMotion && inView;
}
