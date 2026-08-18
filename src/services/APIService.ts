import axios, {
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import { Platform } from 'react-native';
import { API_CONFIG } from '@/config/apiConfig';

const CLIENT_NAME = 'Wapilot Mobile';
const CLIENT_VERSION = '1.0.0';

// Routes that don't need account_id prefix
const nonAccountRoutes = [
  'profile',
  'profile/availability',
  'profile/set_active_account',
  'notification_subscriptions',
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

// Get the base URL - use proxy on web to avoid CORS
function getBaseUrl(): string {
  if (Platform.OS === 'web') {
    // On web, use the server URL directly (CORS must be handled server-side)
    // Or use a proxy if available
    return API_CONFIG.baseUrl;
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
  }

  public clearAuthHeaders() {
    this.authHeaders = null;
    this.accountId = 0;
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
        const headers = this.getHeaders();

        // Set base URL
        config.baseURL = getBaseUrl();

        // Build the full URL with proper prefix
        const url = config.url || '';

        // Auth routes - no prefix needed (they use /auth/...)
        if (authRoutes.some(route => url.startsWith(route))) {
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

        console.log('API Request:', config.method?.toUpperCase(), `${config.baseURL}/${config.url}`);

        return {
          ...config,
          headers: {
            ...config.headers,
            ...headers,
          },
        } as InternalAxiosRequestConfig;
      },
      (error: AxiosError) => Promise.reject(error),
    );

    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log('API Response:', response.status, response.config.url);
        return response;
      },
      async (error: AxiosError) => {
        console.error('API Error:', error.response?.status, error.config?.url);
        console.error('API Error Details:', error.response?.data);
        
        if (axios.isCancel(error)) {
          return Promise.reject(error);
        }
        if (error.response?.status === 401) {
          this.clearAuthHeaders();
        }
        return Promise.reject(error);
      },
    );
  }

  public async get<T>(url: string, config?: AxiosRequestConfig) {
    return this.api.get<T>(url, config);
  }

  public async post<T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig) {
    return this.api.post<T>(url, data, config);
  }

  public async put<T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig) {
    return this.api.put<T>(url, data, config);
  }

  public async patch<T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig) {
    return this.api.patch<T>(url, data, config);
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig) {
    return this.api.delete<T>(url, config);
  }
}

export const apiService = APIService.getInstance();
