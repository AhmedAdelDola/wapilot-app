import { apiService } from '@/services/APIService';

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

export interface Contact {
  id: number;
  name: string;
  email: string;
  phone_number: string;
  avatar_url: string;
  thumbnail: string;
  contact_inboxes?: Array<{
    id: number;
    inbox_id: number;
    source_id: string;
  }>;
}

export interface ContactConversation {
  id: number;
  status: string;
  last_activity_at: number;
  unread_count: number;
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
  async getContact(contactId: number, includeContactInboxes: boolean = true): Promise<{ data: Contact }> {
    const response = await apiService.get(`contacts/${contactId}`, {
      params: {
        include_contact_inboxes: includeContactInboxes,
      },
    });
    return response.data;
  }

  /**
   * Update Contact
   * PATCH /api/v1/accounts/{account_id}/contacts/{contact_id}?include_contact_inboxes=false
   *
   * Body: { "name": "Jane Doe", "email": "jane@example.com" }
   */
  async updateContact(contactId: number, data: {
    name?: string;
    email?: string;
    phone_number?: string;
  }): Promise<{ data: Contact }> {
    const response = await apiService.patch(`contacts/${contactId}`, data, {
      params: {
        include_contact_inboxes: false,
      },
    });
    return response.data;
  }

  /**
   * Contact Conversations
   * GET /api/v1/accounts/{account_id}/contacts/{contact_id}/conversations
   */
  async getContactConversations(contactId: number): Promise<ContactConversation[]> {
    const response = await apiService.get(`contacts/${contactId}/conversations`);
    return response.data.payload;
  }
}

export const contactService = new ContactService();
