const fs = require('fs');
const path = require('path');

const arPath = path.join(__dirname, '..', 'src', 'i18n', 'i18n', 'ar.json');
const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));

// Helper to deeply merge objects
function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (source[key] instanceof Object && key in target && target[key] instanceof Object) {
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

const additions = {
  LOGIN: {
    SSO_AUTH_FAILED: "فشل تسجيل الدخول عبر SSO",
    SSO_INVALID_RESPONSE: "استجابة غير صالحة من خادم SSO",
    SSO_UNEXPECTED_ERROR: "حدث خطأ غير متوقع أثناء تسجيل الدخول عبر SSO"
  },
  MFA: {
    TITLE: "المصادقة الثنائية",
    TABS: {
      AUTHENTICATOR_APP: "تطبيق المصادقة",
      BACKUP_CODE: "رمز النسخ الاحتياطي"
    },
    INSTRUCTIONS: {
      AUTHENTICATOR: "أدخل الرمز المكون من 6 أرقام من تطبيق المصادقة الخاص بك",
      BACKUP: "أدخل أحد رموز النسخ الاحتياطي لحسابك"
    },
    PLACEHOLDERS: {
      BACKUP_CODE: "رمز النسخ الاحتياطي"
    },
    BUTTONS: {
      VERIFY: "تحقق",
      VERIFYING: "جاري التحقق..."
    }
  },
  CONVERSATION: {
    LONG_PRESS_ACTIONS: {
      TRANSLATE: "ترجمة الرسالة"
    },
    TRANSLATE_SUCCESS: "تمت ترجمة الرسالة بنجاح",
    TRANSLATE_ERROR: "فشل ترجمة الرسالة",
    VIEW_ORIGINAL: "عرض النص الأصلي",
    VIEW_TRANSLATED: "عرض الترجمة"
  },
  CONTACT_DETAILS: {
    PHONE: "رقم الهاتف",
    LOCATION: "الموقع",
    COMPANY: "الشركة"
  },
  CONVERSATION_ATTACHMENT: {
    OPTIONS: {
      PHOTOS: "الصور",
      CAMERA: "الكاميرا",
      ATTACH_FILE: "إرفاق ملف",
      MACROS: "الماكرو",
      WHATSAPP_TEMPLATES: "قوالب واتساب"
    }
  },
  CONTACT_LABELS: {
    TITLE: "وسوم جهة الاتصال",
    ADD_LABEL: "إضافة وسم",
    EMPTY_LIST: "لا توجد وسوم متاحة",
    NO_LABEL: "بدون وسم",
    UPDATE_LABEL: "تحديث الوسم",
    SELECTED: "محدد",
    NOT_SELECTED: "غير محدد",
    NO_RESULT: "لم يتم العثور على نتائج"
  },
  ERRORS: {
    UNEXPECTED_TITLE: "حدث خطأ غير متوقع",
    UNEXPECTED_DESCRIPTION: "حدث خطأ ما، يرجى المحاولة مرة أخرى لاحقاً",
    TRY_AGAIN: "إعادة المحاولة"
  },
  CONTENT_TEMPLATE: {
    TITLE: "قوالب الرسائل",
    SELECT_TEMPLATE: "اختر قالباً",
    VARIABLES: "المتغيرات",
    SEND: "إرسال",
    NO_TEMPLATES: "لا توجد قوالب متاحة",
    NO_RESULTS: "لم يتم العثور على قوالب",
    SEARCH_PLACEHOLDER: "البحث في القوالب...",
    IMAGE_URL: "رابط الصورة",
    VIDEO_URL: "رابط الفيديو",
    DOCUMENT_URL: "رابط المستند",
    MEDIA_URL: "رابط الوسائط",
    IMAGE_URL_PLACEHOLDER: "أدخل رابط الصورة",
    MEDIA_URL_PLACEHOLDER: "أدخل رابط الوسائط",
    IMAGE_PREVIEW_FAILED: "فشل معاينة الصورة",
    DOCUMENT_NAME: "اسم المستند",
    DOCUMENT_NAME_PLACEHOLDER: "أدخل اسم المستند",
    BUTTON_PARAMETERS: "معاملات الأزرار"
  },
  SEARCH: {
    PLACEHOLDER: "بحث...",
    HINT: "ابحث عن المحادثات والرسائل وجهات الاتصال",
    ALL_RESULTS: "جميع النتائج",
    RECENT_SEARCHES: "عمليات البحث الأخيرة",
    CLEAR_ALL: "مسح الكل",
    VIEW_MORE: "عرض المزيد",
    TAP_TO_RETRY: "اضغط لإعادة المحاولة",
    NO_RESULTS: "لا توجد نتائج مطابقة",
    ERROR_CANCELLED: "تم إلغاء البحث",
    ERROR_GENERIC: "حدث خطأ أثناء البحث",
    SECTIONS: {
      CONTACTS: "جهات الاتصال",
      CONVERSATIONS: "المحادثات",
      MESSAGES: "الرسائل"
    }
  },
  COPILOT: {
    IMPROVE_REPLY: "تحسين الرد",
    CHANGE_TONE: "تغيير النبرة",
    FIX_GRAMMAR: "تصحيح القواعد",
    SUGGEST_REPLY: "اقتراح رد",
    SUMMARIZE: "تلخيص",
    THINKING: "جاري التفكير...",
    FOLLOW_UP_PLACEHOLDER: "اطلب تعديلاً أو متابعة...",
    SELECT_TONE: "اختر النبرة",
    TONE_PROFESSIONAL: "مهني",
    TONE_FRIENDLY: "ودود",
    TONE_STRAIGHTFORWARD: "مباشر",
    TONE_CASUAL: "غير رسمي",
    TONE_CONFIDENT: "واثق",
    GENERATION_FAILED: "فشل توليد الرد",
    FOLLOW_UP_FAILED: "فشلت المتابعة"
  },
  CHANGE_PASSWORD: {
    VALIDATION: {
      CURRENT_REQUIRED: "كلمة المرور الحالية مطلوبة",
      NEW_MIN_LENGTH: "يجب أن تكون كلمة المرور 8 أحرف على الأقل",
      NEW_UPPERCASE: "يجب أن تحتوي على حرف كبير واحد على الأقل",
      NEW_LOWERCASE: "يجب أن تحتوي على حرف صغير واحد على الأقل",
      NEW_NUMBER: "يجب أن تحتوي على رقم واحد على الأقل",
      NEW_SPECIAL: "يجب أن تحتوي على رمز خاص واحد على الأقل",
      CONFIRM_MISMATCH: "كلمتا المرور غير متطابقتين"
    }
  }
};

deepMerge(ar, additions);
fs.writeFileSync(arPath, JSON.stringify(ar, null, 2), 'utf8');
console.log('Successfully updated ar.json with all missing translation keys!');
