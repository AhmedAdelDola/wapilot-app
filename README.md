# Message Pro App - Custom Chatwoot Mobile App

تم إنشاء التطبيق بنجاح بـ Design من Chatwoot.

## هيكل المشروع

```
message-pro-app/
├── src/
│   ├── components/          # UI Components
│   │   ├── button/         # Button components
│   │   └── common/         # Avatar, BottomSheet, Search, Tabs
│   ├── config/
│   │   └── apiConfig.ts    # API endpoints configuration
│   ├── screens/
│   │   ├── auth/           # Login screen
│   │   ├── home/           # Conversations list
│   │   └── chat/           # Chat screen
│   ├── services/
│   │   ├── APIService.ts   # Axios HTTP client
│   │   ├── authService.ts  # Authentication API
│   │   └── conversationService.ts # Conversations API
│   ├── store/
│   │   ├── store.ts        # Redux store
│   │   ├── auth/           # Auth slice
│   │   └── conversation/   # Conversation slice
│   ├── theme/              # Design System (colors, tailwind)
│   ├── types/              # TypeScript types
│   ├── utils/              # Utility functions
│   └── svg-icons/          # SVG icons
├── App.tsx                 # Main app entry
├── package.json            # Dependencies
└── tsconfig.json           # TypeScript config
```

## Commandات التشغيل

```bash
# تثبيت الـ Dependencies
pnpm install

# تشغيل التطبيق
pnpm start

# تشغيل على Android
pnpm android

# تشغيل على iOS
pnpm ios
```

## الإعدادات

### Base URL
يجب تعديل `src/config/apiConfig.ts` لتحديد رابط السيرفر:

```typescript
export const API_CONFIG = {
  baseUrl: 'https://omni.message-pro.com',  // غيّر هذا
  websocketUrl: 'wss://omni.message-pro.com',
  // ...
};
```

### Authentication
يستخدم التطبيق Devise Token Auth مع headers:
- `access-token`
- `client`
- `uid`

## الشاشات

1. **LoginScreen** - تسجيل الدخول
2. **HomeScreen** - قائمة المحادثات
3. **ChatScreen** - شاشة المحادثة

## الخطوات التالية

1. تعديل الـ Colors والـ Theme حسب تصميمك
2. إضافة شاشات إضافية (Settings, Profile, etc.)
3. إضافة Push Notifications
4. إضافة Real-time updates مع WebSocket
