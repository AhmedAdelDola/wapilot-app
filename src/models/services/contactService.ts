import { apiService } from '@/models/services/APIService';

/**
 * Contacts Service
 *
 * Based on Postman Collection:
 * - List Contacts: GET /api/v1/accounts/{account_id}/contacts
 * - Search Contacts: GET /api/v1/accounts/{account_id}/contacts/search
 * - Get Contact: GET /api/v1/accounts/{account_id}/contacts/{contact_id}
 * - Update Contact: PATCH /api/v1/accounts/{account_id}/contacts/{contact_id}
 * - Contact Conversations: GET /api/v1/accounts/{account_id}/contacts/{contact_id}/conversations
 */

export interface ContactInbox {
  id: number;
  inbox_id: number;
  source_id: string;
  inbox?: {
    id: number;
    name: string;
    channel_type: string;
  };
}

export interface Contact {
  id: number;
  name: string;
  lifecycle_stage_id?: number | null;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  avatar_url?: string;
  thumbnail?: string;
  location?: string;
  company_name?: string;
  company?: {
    id?: number;
    name?: string;
  };
  additional_attributes?: {
    city?: string;
    country?: string;
    country_code?: string;
    description?: string;
    social_profiles?: {
      twitter?: string;
      linkedin?: string;
      facebook?: string;
      github?: string;
      instagram?: string;
    };
    [key: string]: any;
  };
  custom_attributes?: Record<string, any>;
  created_at?: string | number;
  updated_at?: string | number;
  last_activity_at?: string | number;
  contact_inboxes?: ContactInbox[];
  conversations_count?: number;
  previous_conversation?: {
    id: number;
    status: string;
  };
}

export interface ContactConversation {
  id: number;
  status: string;
  last_activity_at: number;
  unread_count: number;
  inbox_id?: number;
  meta?: {
    sender?: { name: string; thumbnail?: string };
    assignee?: { name: string; thumbnail?: string };
  };
}

export interface ContactListResponse {
  data: {
    payload: Contact[];
    meta: {
      count: number;
      current_page: number;
      total_pages: number;
    };
  };
}

export interface UpdateContactPayload {
  name?: string;
  lifecycle_stage_id?: number | null;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  location?: string;
  company_name?: string;
  additional_attributes?: Record<string, any>;
  custom_attributes?: Record<string, any>;
}

class ContactService {
  /**
   * List Contacts
   * GET /api/v1/accounts/{account_id}/contacts?include_contact_inboxes=true&page=1&sort=name
   */
  async listContacts(params: {
    page?: number;
    sort?: string;
    include_contact_inboxes?: boolean;
  } = {}): Promise<ContactListResponse['data']> {
    const response = await apiService.get('contacts', {
      params: {
        include_contact_inboxes: params.include_contact_inboxes ?? true,
        page: params.page || 1,
        sort: params.sort || 'name',
      },
    });
    return response.data.data;
  }

  /**
   * Search Contacts
   * GET /api/v1/accounts/{account_id}/contacts/search?include_contact_inboxes=true&page=1&sort=name&q=Jane
   */
  async searchContacts(query: string, params: {
    page?: number;
    sort?: string;
    include_contact_inboxes?: boolean;
  } = {}): Promise<ContactListResponse['data']> {
    const response = await apiService.get('contacts/search', {
      params: {
        include_contact_inboxes: params.include_contact_inboxes ?? true,
        page: params.page || 1,
        sort: params.sort || 'name',
        q: query,
      },
    });
    return response.data.data;
  }

  /**
   * Get Contact
   * GET /api/v1/accounts/{account_id}/contacts/{contact_id}?include_contact_inboxes=true
   */
  async getContact(contactId: number, includeContactInboxes: boolean = true): Promise<Contact> {
    const response = await apiService.get(`contacts/${contactId}`, {
      params: {
        include_contact_inboxes: includeContactInboxes,
      },
    });
    // API returns { payload: Contact } for this endpoint
    const raw = response.data;
    const contact = (raw?.payload ?? raw?.data ?? raw) as Contact;
    return contact;
  }

  /**
   * Update Contact
   * PATCH /api/v1/accounts/{account_id}/contacts/{contact_id}
   */
  async updateContact(contactId: number, data: UpdateContactPayload): Promise<Contact> {
    const response = await apiService.patch(`contacts/${contactId}`, data, {
      params: { include_contact_inboxes: false },
    });
    const raw = response.data;
    return (raw?.data ?? raw) as Contact;
  }

  /**
   * Contact Conversations
   * GET /api/v1/accounts/{account_id}/contacts/{contact_id}/conversations
   */
  async getContactConversations(contactId: number): Promise<ContactConversation[]> {
    const response = await apiService.get(`contacts/${contactId}/conversations`);
    return response.data.payload ?? response.data ?? [];
  }

  async createContact(data: UpdateContactPayload & {
    custom_attributes?: Record<string, any>;
  }): Promise<Contact> {
    const response = await apiService.post('contacts', data);
    const raw = response.data;
    return (raw?.data ?? raw) as Contact;
  }
}

export const contactService = new ContactService();
