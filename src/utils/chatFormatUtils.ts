/**
 * Shared utility helpers for timestamp parsing and chat date/time formatting.
 */

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

export const formatChatTime = (rawTime?: number | string | null, isArabic = false): string => {
  if (!rawTime) return '';
  let timestamp: number;
  if (typeof rawTime === 'string') {
    const num = Number(rawTime);
    if (!isNaN(num) && num > 0) {
      timestamp = num > 1e11 ? num : num * 1000;
    } else {
      const d = new Date(rawTime);
      if (isNaN(d.getTime())) return '';
      timestamp = d.getTime();
    }
  } else if (typeof rawTime === 'number') {
    if (rawTime <= 0) return '';
    timestamp = rawTime > 1e11 ? rawTime : rawTime * 1000;
  } else {
    return '';
  }

  const date = new Date(timestamp);
  const now = new Date();

  // Reset hours to compare calendar days reliably
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 86400000;
  const itemDateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

  if (itemDateStart === todayStart) {
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? (isArabic ? 'م' : 'PM') : (isArabic ? 'ص' : 'AM');
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  }

  if (itemDateStart === yesterdayStart) {
    return isArabic ? 'أمس' : 'Yesterday';
  }

  const diffDays = Math.round((todayStart - itemDateStart) / 86400000);
  if (diffDays < 7 && diffDays > 0) {
    const daysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const daysAr = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    return isArabic ? daysAr[date.getDay()] : daysEn[date.getDay()];
  }

  const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthsAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

  if (date.getFullYear() === now.getFullYear()) {
    return isArabic
      ? `${date.getDate()} ${monthsAr[date.getMonth()]}`
      : `${monthsEn[date.getMonth()]} ${date.getDate()}`;
  }

  return isArabic
    ? `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
    : `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
};
