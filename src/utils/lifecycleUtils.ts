/**
 * Shared utility helper for matching conversations to lifecycle stages.
 */

export const matchesStage = (c: any, stageName: string, stageId?: number): boolean => {
  if (!c) return false;
  const sLower = stageName.toLowerCase().trim();
  const sKey = sLower.replace(/\s+/g, '_');
  const sFirst = sLower.split(/\s+/)[0];
  const senderStage = c.meta?.sender?.lifecycleStage ?? c.meta?.sender?.lifecycle_stage;

  if (
    (stageId && String(senderStage?.id) === String(stageId)) ||
    (senderStage?.name && senderStage.name.toLowerCase().trim() === sLower)
  ) {
    return true;
  }

  if (Array.isArray(c.labels) && c.labels.length > 0) {
    const hasMatch = c.labels.some((l: any) => {
      if (typeof l !== 'string') return false;
      const ll = l.toLowerCase().trim();
      return (
        ll === sLower ||
        ll === sKey ||
        ll === sFirst ||
        ll.includes(sLower) ||
        sLower.includes(ll) ||
        (stageId && ll === String(stageId))
      );
    });
    if (hasMatch) return true;
  }

  const caStage =
    c.customAttributes?.lifecycle_stage ||
    c.customAttributes?.stage ||
    c.customAttributes?.lifecycleStage ||
    c.custom_attributes?.lifecycle_stage ||
    c.custom_attributes?.stage ||
    c.additionalAttributes?.lifecycle_stage;

  if (caStage) {
    const caStr = String(caStage).toLowerCase().trim();
    if (
      caStr === sLower ||
      caStr === sKey ||
      caStr === sFirst ||
      caStr.includes(sLower) ||
      sLower.includes(caStr) ||
      (stageId && caStr === String(stageId))
    ) {
      return true;
    }
  }

  const senderCa =
    c.meta?.sender?.customAttributes?.lifecycle_stage ||
    c.meta?.sender?.customAttributes?.stage ||
    c.meta?.sender?.custom_attributes?.lifecycle_stage ||
    c.meta?.sender?.additionalAttributes?.lifecycle_stage;

  if (senderCa) {
    const scaStr = String(senderCa).toLowerCase().trim();
    if (
      scaStr === sLower ||
      scaStr === sKey ||
      scaStr === sFirst ||
      scaStr.includes(sLower) ||
      sLower.includes(scaStr) ||
      (stageId && scaStr === String(stageId))
    ) {
      return true;
    }
  }

  return false;
};
