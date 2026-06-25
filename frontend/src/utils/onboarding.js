export const ONBOARDING_KEY = 'tradecrm_onboarded';
export const REPLAY_ONBOARDING_EVENT = 'tradecrm:replay-tour';

export const replayOnboardingTour = () => {
  localStorage.removeItem(ONBOARDING_KEY);
  window.dispatchEvent(new Event(REPLAY_ONBOARDING_EVENT));
};
