import { apiService } from '@/services/APIService';

/**
 * Authentication Service
 *
 * Based on Postman Collection:
 * - Sign In: POST /auth/sign_in
 * - Validate Session: GET /auth/validate_token
 * - Sign Out: DELETE /auth/sign_out
 *
 * Auth headers (access-token, client, uid) are rotated after each response
 */

export interface AuthHeaders {
  'access-token': string;
  uid: string;
  client: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface UserData {
  id: number;
  name: string;
  email: string;
  account_id: number;
  pubsub_token: string;
  avatar_url: string;
  available_name: string;
  role: string;
  availability: string;
  thumbnail: string;
  availability_status: string;
  accounts: Array<{
    id: number;
    name: string;
    role: string;
  }>;
}

export interface LoginResponse {
  user: UserData;
  headers: AuthHeaders;
}

export interface ProfileResponse {
  user: UserData;
}

class AuthService {
  /**
   * Sign In
   * POST /auth/sign_in
   *
   * Stores the auth headers, active account ID, user ID, and ActionCable pubsub token
   */
  async login(payload: LoginPayload): Promise<LoginResponse> {
    console.log('AuthService: Calling POST /auth/sign_in');
    console.log('AuthService: Base URL will be:', 'https://omni.wapilot.net');
    
    const response = await apiService.post('auth/sign_in', {
      email: payload.email,
      password: payload.password,
    });

    console.log('AuthService: Response status:', response.status);
    console.log('AuthService: Response headers:', Object.keys(response.headers));

    // Extract auth headers from response
    const headers: AuthHeaders = {
      'access-token': response.headers['access-token'],
      uid: response.headers.uid,
      client: response.headers.client,
    };

    console.log('AuthService: Headers extracted:', {
      hasAccessToken: !!headers['access-token'],
      hasUid: !!headers.uid,
      hasClient: !!headers.client,
    });

    // Set headers for subsequent requests
    apiService.setAuthHeaders(headers);

    return {
      user: response.data.data,
      headers,
    };
  }

  /**
   * Validate Session
   * GET /auth/validate_token
   *
   * Validates the current session and returns user data
   */
  async validateToken(): Promise<UserData> {
    const response = await apiService.get('auth/validate_token');
    return response.data.data;
  }

  /**
   * Sign Out
   * DELETE /auth/sign_out
   *
   * Destroys the current session
   */
  async signOut(): Promise<void> {
    try {
      await apiService.delete('auth/sign_out');
    } finally {
      apiService.clearAuthHeaders();
    }
  }
}

export const authService = new AuthService();
