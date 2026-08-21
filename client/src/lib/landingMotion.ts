export const dashboardReveal = {
  hidden: { opacity: 0, y: 48, scale: 0.975 },
  visible: { opacity: 1, y: 0, scale: 1 },
} as const;

export const previewPanelReveal = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0 },
} as const;

export function shouldRunLandingMotion(reducedMotion: boolean | null, inView: boolean) {
  return !reducedMotion && inView;
}
