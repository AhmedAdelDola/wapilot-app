export const parseDate = (rawTime?: number | string | null): Date | null => {
  if (!rawTime) return null;
  if (typeof rawTime === 'string') {
    const num = Number(rawTime);
    if (!isNaN(num) && num > 0) {
      return new Date(num > 1e11 ? num : num * 1000);
    }
    const d = new Date(rawTime);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof rawTime === 'number') {
    if (rawTime <= 0) return null;
    return new Date(rawTime > 1e11 ? rawTime : rawTime * 1000);
  }
  return null;
};

export const formatMessageTime = (rawTime?: number | string | null): string => {
  const date = parseDate(rawTime);
  if (!date) return '';
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
};

export const formatMessageDate = (rawTime?: number | string | null, isArabic = false): string => {
  const date = parseDate(rawTime);
  if (!date) return '';
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 86400000;
  const itemDateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

  if (itemDateStart === todayStart) {
    return isArabic ? 'اليوم' : 'Today';
  }
  if (itemDateStart === yesterdayStart) {
    return isArabic ? 'أمس' : 'Yesterday';
  }
  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
};

export const isSameDay = (time1?: number | string | null, time2?: number | string | null): boolean => {
  const d1 = parseDate(time1);
  const d2 = parseDate(time2);
  if (!d1 || !d2) return false;
  return (
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear()
  );
};
