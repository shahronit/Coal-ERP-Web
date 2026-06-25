import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Joyride, STATUS } from 'react-joyride';
import { useTranslation } from 'react-i18next';
import { ONBOARDING_KEY, REPLAY_ONBOARDING_EVENT } from '../utils/onboarding';
import { isDesktopApp } from '../utils/apiBase';

const waitForSelector = (selector, timeoutMs = 5000) => new Promise((resolve) => {
  if (document.querySelector(selector)) {
    resolve(true);
    return;
  }
  const started = Date.now();
  const timer = window.setInterval(() => {
    if (document.querySelector(selector)) {
      window.clearInterval(timer);
      resolve(true);
      return;
    }
    if (Date.now() - started >= timeoutMs) {
      window.clearInterval(timer);
      resolve(false);
    }
  }, 100);
});

export default function OnboardingTour() {
  const { t } = useTranslation();
  const location = useLocation();
  const onDashboard = location.pathname === '/dashboard' || location.pathname.startsWith('/dashboard/');
  const [run, setRun] = useState(false);
  const desktopApp = isDesktopApp();

  const steps = useMemo(() => ([
    {
      target: '[data-tour="dashboard-summary"]',
      title: t('onboarding.dashboardTitle'),
      content: t('onboarding.dashboardBody'),
      disableBeacon: true,
    },
    {
      target: '[data-tour="main-navigation"]',
      title: t('onboarding.navTitle'),
      content: t('onboarding.navBody'),
    },
    {
      target: '[data-tour="quick-actions"]',
      title: t('onboarding.quickTitle'),
      content: t('onboarding.quickBody'),
    },
    {
      target: '[data-tour="floating-help"]',
      title: t('onboarding.helpTitle'),
      content: t('onboarding.helpBody'),
    },
  ]), [t]);

  const availableSteps = useMemo(
    () => steps.filter((step) => document.querySelector(step.target)),
    [steps, run, onDashboard],
  );

  useEffect(() => {
    if (desktopApp || !onDashboard || localStorage.getItem(ONBOARDING_KEY) === 'true') {
      setRun(false);
      return undefined;
    }

    let cancelled = false;
    waitForSelector('[data-tour="dashboard-summary"]').then((ready) => {
      if (!cancelled && ready) setRun(true);
    });

    return () => { cancelled = true; };
  }, [desktopApp, onDashboard]);

  useEffect(() => {
    const replay = () => {
      if (onDashboard && !desktopApp) setRun(true);
    };
    window.addEventListener(REPLAY_ONBOARDING_EVENT, replay);
    return () => window.removeEventListener(REPLAY_ONBOARDING_EVENT, replay);
  }, [desktopApp, onDashboard]);

  if (desktopApp || !onDashboard || !availableSteps.length) return null;

  return (
    <Joyride
      run={run}
      continuous
      showSkipButton
      disableOverlayClose={false}
      spotlightClicks
      steps={availableSteps}
      locale={{
        back: t('actions.back'),
        close: t('actions.finish'),
        last: t('actions.finish'),
        next: t('actions.next'),
        skip: t('actions.skip'),
      }}
      styles={{ options: { zIndex: 2000 } }}
      callback={({ status }) => {
        if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
          localStorage.setItem(ONBOARDING_KEY, 'true');
          setRun(false);
        }
      }}
    />
  );
}
