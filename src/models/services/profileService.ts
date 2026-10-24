import { apiService } from '@/models/services/APIService';

/**
 * Profile and Bootstrap Service
 *
 * Based on Postman Collection:
 * - Get Profile: GET /api/v1/profile
 * - Set Active Account: PUT /api/v1/profile/set_active_account
 * - Set Availability: POST /api/v1/profile/availability
 * - List Inboxes: GET /api/v1/accounts/{account_id}/inboxes
 * - List Assignable Agents: GET /api/v1/accounts/{account_id}/assignable_agents?inbox_ids[]={inbox_id}
 * - List Canned Responses: GET /api/v1/accounts/{account_id}/canned_responses
 * - List Labels: GET /api/v1/accounts/{account_id}/labels
 */

export interface ProfileData {
  id: number;
  name: string;
  email: string;
  account_id: number;
  accounts: Array<{
    id: number;
    name: string;
    role: string;
  }>;
  pubsub_token: string;
  avatar_url: string;
  available_name: string;
  role: string;
  availability: string;
  thumbnail: string;
  availability_status: string;
}

export interface Inbox {
  id: number;
  name: string;
  channel_type: string;
  avatar_url: string;
  account_id: number;
  website_token: string;
  enable_auto_assignment: boolean;
}

export interface Agent {
  id: number;
  name: string;
  available_name: string;
  avatar_url: string;
  thumbnail: string;
  availability_status: string;
  role: string;
}

export interface CannedResponse {
  id: number;
  short_code: string;
  content: string;
}

export interface Label {
  id: number;
  title: string;
  color: string;
}

export interface LifecycleStage {
  id: number;
  name: string;
  color?: string;
  icon?: string;
  sort_order?: number;
}

class ProfileService {
  /**
   * Get Profile
   * GET /api/v1/profile
   *
   * Returns all accounts available to the signed-in agent,
   * account role and permissions, and the ActionCable pubsub token
   */
  async getProfile(): Promise<ProfileData> {
    const response = await apiService.get('profile');
    return response.data.data;
  }

  /**
   * Set Active Account
   * PUT /api/v1/profile/set_active_account
   *
   * Sets the active account for the signed-in agent
   */
  async setActiveAccount(accountId: number): Promise<ProfileData> {
    const response = await apiService.put('profile/set_active_account', {
      profile: { account_id: accountId },
    });
    return response.data.data;
  }

  /**
   * Set Availability
   * POST /api/v1/profile/availability
   *
   * Sets the availability status for the signed-in agent
   */
  async setAvailability(accountId: number, availability: string): Promise<ProfileData> {
    const response = await apiService.post('profile/availability', {
      profile: {
        account_id: accountId,
        availability,
      },
    });
    return response.data.data;
  }

  /**
   * List Inboxes
   * GET /api/v1/accounts/{account_id}/inboxes
   *
   * Returns all inboxes for the account
   */
  async listInboxes(): Promise<Inbox[]> {
    const response = await apiService.get('inboxes');
    return response.data.payload;
  }

  /**
   * List Assignable Agents
   * GET /api/v1/accounts/{account_id}/assignable_agents?inbox_ids[]={inbox_id}
   *
   * Returns all agents assignable to the given inbox
   */
  async listAssignableAgents(inboxId?: number): Promise<Agent[]> {
    const params: Record<string, string> = {};
    if (inboxId) {
      params['inbox_ids[]'] = String(inboxId);
    }
    const response = await apiService.get('assignable_agents', { params });
    return response.data.payload;
  }

  /**
   * List Canned Responses
   * GET /api/v1/accounts/{account_id}/canned_responses
   *
   * Returns all canned responses for the account
   */
  async listCannedResponses(searchKey?: string): Promise<CannedResponse[]> {
    const url = searchKey ? `canned_responses?search=${searchKey}` : 'canned_responses';
    const response = await apiService.get(url);
    const data: any = response.data;
    if (Array.isArray(data)) {
      return data;
    }
    if (data && Array.isArray(data.payload)) {
      return data.payload;
    }
    return [];
  }

  /**
   * List Labels
   * GET /api/v1/accounts/{account_id}/labels
   *
   * Returns all labels for the account
   */
  async listLabels(): Promise<Label[]> {
    try {
      const response = await apiService.get('labels');
      const data: any = response.data;
      if (Array.isArray(data)) {
        return data;
      }
      if (data && Array.isArray(data.payload)) {
        return data.payload;
      }
      return [];
    } catch {
      return [];
    }
  }

  /**
   * List Lifecycle Stages
   * GET /api/v1/accounts/{account_id}/lifecycle_stages
   *
   * Returns all lifecycle stages for building customer segment filters
   */
  async listLifecycleStages(): Promise<LifecycleStage[]> {
    try {
      const response = await apiService.get('lifecycle_stages');
      return response.data.payload || response.data.data || response.data || [];
    } catch {
      return [];
    }
  }
/**
   * Update Profile
   * PUT /api/v1/profile
   */
  async updateProfile(data: {
    name?: string;
    display_name?: string;
    email?: string;
    avatar?: { uri: string; name?: string; type?: string } | null;
  }): Promise<ProfileData> {
    if (data.avatar && data.avatar.uri) {
      const formData = new FormData();
      if (data.name) formData.append('name', data.name);
      if (data.display_name) formData.append('display_name', data.display_name);
      if (data.email) formData.append('email', data.email);

      const uri = data.avatar.uri;
      const filename = data.avatar.name || uri.split('/').pop() || 'avatar.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = data.avatar.type || (match ? `image/${match[1]}` : 'image/jpeg');

      formData.append('avatar', {
        uri,
        name: filename,
        type,
      } as any);

      const response = await apiService.put('profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data?.data || response.data;
    }

    const payload: Record<string, any> = {};
    if (data.name) payload.name = data.name;
    if (data.display_name) payload.display_name = data.display_name;
    if (data.email) payload.email = data.email;

    const body = {
      ...payload,
      profile: payload,
    };

    try {
      const response = await apiService.put('profile', body);
      return response.data?.data || response.data;
    } catch {
      const response = await apiService.patch('profile', body);
      return response.data?.data || response.data;
    }
  }
}

export const profileService = new ProfileService();
