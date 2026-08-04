"use client";

import { useMediaQuery } from "@/hooks/use-media-query";
import { useCallback, useEffect, useState } from "react";

/** Breakpoint wizard campaign form — khớp invite-join-group */
export const CAMPAIGN_FORM_WIZARD_MEDIA = "(max-width: 1023px)";

/**
 * State wizard mobile cho form kịch bản.
 * Desktop: isWizard=false → UI 2 cột như cũ.
 */
export function useCampaignFormWizard(open: boolean) {
  const isWizard = useMediaQuery(CAMPAIGN_FORM_WIZARD_MEDIA);
  const [wizardStep, setWizardStep] = useState(0);

  useEffect(() => {
    if (open) setWizardStep(0);
  }, [open]);

  const goBack = useCallback(() => {
    setWizardStep((s) => Math.max(0, s - 1));
  }, []);

  const goNext = useCallback((max: number) => {
    setWizardStep((s) => Math.min(s + 1, Math.max(0, max)));
  }, []);

  return {
    isWizard,
    wizardStep,
    setWizardStep,
    goBack,
    goNext,
  };
}
