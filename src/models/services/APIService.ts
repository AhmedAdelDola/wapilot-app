import axios, {
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import { Platform } from 'react-native';
import { API_CONFIG } from '@/config/apiConfig';
import { getStore } from '@/viewmodels/store/storeAccessor';
import { saveAuthHeaders, clearAuthTokens, getAuthHeaders } from '@/utils/secureStore';

const CLIENT_NAME = 'Message Pro Mobile';
const CLIENT_VERSION = '1.0.0';

// Routes that don't need account_id prefix
const nonAccountRoutes = [
  'profile',
  'profile/availability',
  'profile/set_active_account',
  'notification_subscriptions',
  'support',
];

// Auth routes (no /api/v1 prefix)
const authRoutes = ['auth/sign_in', 'auth/validate_token', 'auth/sign_out'];

function deviceHeaders(): Record<string, string> {
  const platform = 'mobile';
  const osVersion = '1.0.0';
  const model = 'Unknown';
  return {
    'X-Chatwoot-Client-Name': CLIENT_NAME,
    'X-Chatwoot-Client-Version': CLIENT_VERSION,
    'X-Chatwoot-Platform': platform,
    'X-Chatwoot-Platform-Version': osVersion,
    'X-Chatwoot-Device-Model': model,
    'User-Agent': `${CLIENT_NAME}/${CLIENT_VERSION} (${platform} ${osVersion}; ${model})`,
  };
}

// Get the base URL - dynamically read from Redux settings if available, fallback to API_CONFIG.baseUrl
function getBaseUrl(): string {
  try {
    const store = getStore();
    const installationUrl = store?.getState()?.settings?.installationUrl;
    if (installationUrl && typeof installationUrl === 'string' && installationUrl.trim()) {
      return installationUrl.trim().replace(/\/+$/, '');
    }
  } catch {
    // Store not initialized yet
  }
  return API_CONFIG.baseUrl;
}

class APIService {
  private static instance: APIService;
  private api = axios.create();
  private authHeaders: {
    'access-token': string;
    uid: string;
    client: string;
  } | null = null;
  private accountId: number = 0;
  private isLoggingOut: boolean = false;

  private constructor() {
    Object.assign(this.api.defaults.headers.common, deviceHeaders());
    this.setupInterceptors();
  }

  public static getInstance(): APIService {
    if (!APIService.instance) {
      APIService.instance = new APIService();
    }
    return APIService.instance;
  }

  public setAuthHeaders(headers: { 'access-token': string; uid: string; client: string }) {
    this.authHeaders = headers;
    this.isLoggingOut = false;
    void saveAuthHeaders(headers);
  }

  public clearAuthHeaders() {
    this.authHeaders = null;
    this.accountId = 0;
    void clearAuthTokens();
  }

  public async initFromSecureStore(): Promise<boolean> {
    try {
      const headers = await getAuthHeaders();
      if (headers) {
        this.authHeaders = headers;
        return true;
      }
    } catch {
      // Non-blocking
    }
    return false;
  }

  public setAccountId(id: number) {
    this.accountId = id;
  }

  private getHeaders() {
    if (!this.authHeaders) return {};
    return {
      'access-token': this.authHeaders['access-token'],
      uid: this.authHeaders.uid,
      client: this.authHeaders.client,
    };
  }

  private setupInterceptors() {
    this.api.interceptors.request.use(
      async (config: AxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
        // Set base URL
        config.baseURL = getBaseUrl();

        // Fallback to Redux store accountId if not set yet
        if (!this.accountId) {
          try {
            const store = getStore();
            const storeAccountId = store?.getState()?.auth?.user?.account_id;
            if (storeAccountId) {
              this.accountId = Number(storeAccountId);
            }
          } catch {
            // store not available yet
          }
        }

        // Build the full URL with proper prefix
        const url = config.url || '';

        // If URL already has api/v1/ or auth/ prefix, keep as-is
        if (url.startsWith('api/v1/') || url.startsWith('auth/')) {
          // Keep URL as-is
        }
        // Auth routes - no prefix needed (they use /auth/...)
        else if (authRoutes.some(route => url.startsWith(route))) {
          // Keep URL as-is
        }
        // Non-account routes - use /api/v1/ prefix
        else if (nonAccountRoutes.some(route => url.startsWith(route))) {
          config.url = `api/v1/${url}`;
        }
        // Account routes - use /api/v1/accounts/{account_id}/ prefix
        else if (this.accountId && url) {
          config.url = `api/v1/accounts/${this.accountId}/${url}`;
        }

        // Set auth headers directly on config.headers (works with AxiosHeaders class)
        if (this.authHeaders) {
          (config.headers as any)['access-token'] = this.authHeaders['access-token'];
          (config.headers as any)['uid'] = this.authHeaders.uid;
          (config.headers as any)['client'] = this.authHeaders.client;
        }

        return config as InternalAxiosRequestConfig;
      },
      (error: AxiosError) => Promise.reject(error),
    );

    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        // Rotate auth headers from response (Devise Token Auth)
        const newAccessToken = response.headers['access-token'];
        const newClient = response.headers['client'];
        const newUid = response.headers['uid'];
        if (newAccessToken && newClient && newUid) {
          const newHeaders = {
            'access-token': newAccessToken,
            client: newClient,
            uid: newUid,
          };
          this.authHeaders = newHeaders;
          void saveAuthHeaders(newHeaders);
          try {
            const store = getStore();
            store.dispatch({ type: 'auth/updateAuthHeaders', payload: newHeaders });
          } catch {
            // Store not initialized yet
          }
        }
        return response;
      },
      async (error: AxiosError) => {
        if (error.response?.status === 429) {
          // Rate limited (429) - log gentle warning instead of error spam
          console.warn('API Rate Limit (429):', error.config?.url);
          return Promise.reject(error);
        }

        if (__DEV__) {
          console.error('API Error:', error.response?.status, error.config?.url);
          console.error('API Error Details:', error.response?.data);
        } else {
          // In production mode, log sanitized status and summary to prevent leaking PII in system logs
          const status = error.response?.status ?? 'NETWORK_ERROR';
          const method = error.config?.method?.toUpperCase() || 'REQUEST';
          const url = error.config?.url || '';
          const message = (error.response?.data as any)?.error || error.message || 'Request failed';
          console.error(`API Error [${status}] ${method} ${url}: ${message}`);
        }
        
        if (axios.isCancel(error)) {
          return Promise.reject(error);
        }

        // Auto-logout on 401 (but not for auth routes like sign_in)
        if (error.response?.status === 401 && !this.isLoggingOut) {
          const url = error.config?.url || '';
          const isAuthRoute = authRoutes.some(route => url.startsWith(route));
          if (!isAuthRoute) {
            this.isLoggingOut = true;
            this.clearAuthHeaders();
            try {
              const store = getStore();
              store.dispatch({ type: 'auth/logout' });
            } catch {
              // Store not initialized yet
            }
          }
        }

        return Promise.reject(error);
      },
    );
  }

  public async get<T = any>(url: string, config?: AxiosRequestConfig) {
    return this.api.get<T>(url, config);
  }

  // ---------- Chatwoot Mobile Agent API (from Postman collection) ----------

  /** POST /auth/sign_in — returns user + Devise auth headers */
  public async signIn(email: string, password: string) {
    const res = await this.post<{ data: any }>('auth/sign_in', { email, password });
    const h = res.headers as any;
    if (h['access-token'] && h['client'] && h['uid']) {
      this.setAuthHeaders({
        'access-token': h['access-token'],
        client: h['client'],
        uid: h['uid'],
      });
    }
    return res.data;
  }

  /** GET /api/v1/profile */
  public async getProfile() {
    const res = await this.get<{ data: any }>('profile');
    return res.data;
  }

  /** PUT /api/v1/profile/set_active_account */
  public async setActiveAccount(accountId: number) {
    const res = await this.put<{ data: any }>('profile/set_active_account', {
      profile: { account_id: accountId },
    });
    return res.data;
  }

  /** GET /api/v1/accounts/{account_id}/notifications?page= */
  public async getNotifications(page = 1) {
    const res = await this.get<{ data: any[]; meta?: any }>(`notifications?page=${page}`);
    return res.data;
  }

  /** GET /api/v1/accounts/{account_id}/notifications/unread_count */
  public async getUnreadNotificationCount() {
    const res = await this.get<{ count: number }>('notifications/unread_count');
    return res.data;
  }

  /** POST /api/v1/accounts/{account_id}/notifications/read_all */
  public async markAllNotificationsRead() {
    const res = await this.post('notifications/read_all');
    return res.data;
  }

  /** POST /api/v1/accounts/{account_id}/notifications/{id}/unread */
  public async markNotificationUnread(id: number) {
    const res = await this.post(`notifications/${id}/unread`);
    return res.data;
  }

  /** GET /api/v1/accounts/{account_id}/conversations?status=&assignee_type=&page= */
  public async getConversations(params: { status?: string; assignee_type?: string; page?: number } = {}) {
    const qs = new URLSearchParams();
    if (params.status) qs.set('status', params.status);
    if (params.assignee_type) qs.set('assignee_type', params.assignee_type);
    qs.set('page', String(params.page || 1));
    const res = await this.get<{ data: any[]; meta?: any }>(`conversations?${qs.toString()}`);
    return res.data;
  }

  /** GET /api/v1/accounts/{account_id}/conversations/search?q=&page= */
  public async searchConversations(q: string, page = 1) {
    const res = await this.get<{ data: any[] }>(`conversations/search?q=${encodeURIComponent(q)}&page=${page}`);
    return res.data;
  }

  /** GET /api/v1/accounts/{account_id}/contacts?page=&sort= */
  public async getContacts(params: { page?: number; sort?: string; q?: string } = {}) {
    const qs = new URLSearchParams();
    qs.set('include_contact_inboxes', 'true');
    qs.set('page', String(params.page || 1));
    qs.set('sort', params.sort || 'name');
    if (params.q) qs.set('q', params.q);
    const res = await this.get<{ data: any[]; meta?: any }>(`contacts?${qs.toString()}`);
    return res.data;
  }

  /** POST /api/v1/accounts/{account_id}/contacts — add contact */
  public async createContact(payload: {
    name?: string;
    email?: string;
    phone_number?: string;
    first_name?: string;
    last_name?: string;
  }) {
    const res = await this.post<{ data: any }>('contacts', payload);
    return res.data;
  }

  public async post<T = any, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig) {
    return this.api.post<T>(url, data, config);
  }

  public async put<T = any, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig) {
    return this.api.put<T>(url, data, config);
  }

  public async patch<T = any, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig) {
    return this.api.patch<T>(url, data, config);
  }

  public async delete<T = any>(url: string, config?: AxiosRequestConfig) {
    return this.api.delete<T>(url, config);
  }
}

export const apiService = APIService.getInstance();
