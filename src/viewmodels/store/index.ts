import AsyncStorage from '@react-native-async-storage/async-storage';
import { configureStore, ThunkAction, Action, Middleware, AnyAction } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  createTransform,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import { appReducer } from '@/viewmodels/store/reducers';
import { setStore } from './storeAccessor';
import { contactListenerMiddleware } from './contact/contactListener';

const CURRENT_VERSION = 2;

// Transform to strip sensitive auth tokens before writing state to AsyncStorage
// Sensitive credentials (access-token, client, uid, pubsub_token) are persisted in expo-secure-store instead
const authTransform = createTransform(
  (inboundState: any) => {
    if (!inboundState) return inboundState;
    return {
      ...inboundState,
      headers: null,
      accessToken: null,
      user: inboundState.user
        ? {
            ...inboundState.user,
            pubsub_token: '',
          }
        : null,
    };
  },
  (outboundState: any) => {
    return outboundState;
  },
  { whitelist: ['auth'] },
);

const persistConfig = {
  key: 'Root',
  version: CURRENT_VERSION,
  storage: AsyncStorage,
  whitelist: ['auth', 'settings'],
  transforms: [authTransform],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  migrate: async (state: any) => {
    // If the stored version is older or doesn't exist, return initial state
    if (!state?._persist?.version || state._persist.version < CURRENT_VERSION) {
      const initialState = appReducer(undefined, { type: 'INIT' });
      return {
        ...initialState,
      };
    }
    return state;
  },
};

const middlewares: Middleware[] = [contactListenerMiddleware.middleware];

const rootReducer = (state: ReturnType<typeof appReducer>, action: AnyAction) => {
  if (action.type === 'auth/logout') {
    const initialState = appReducer(undefined, { type: 'INIT' });
    return { ...initialState, settings: state.settings };
  }
  return appReducer(state, action);
};

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        warnAfter: 256,
        ignoredActions: [
          FLUSH,
          REHYDRATE,
          PAUSE,
          PERSIST,
          PURGE,
          REGISTER,
          'auth/setCurrentUserAvailability',
          'contact/updateContactsPresence',
        ],
      },
      immutableCheck: { warnAfter: 256 },
    }).concat(middlewares),
});

// TODO: Please get rid of this
setStore(store);

export const persistor = persistStore(store);

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
