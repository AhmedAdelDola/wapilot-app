import { apiService } from '@/models/services/APIService';
import type { CannedResponseResponse } from '@/viewmodels/store/canned-response/cannedResponseTypes';
import { transformCannedResponse } from '@/utils/camelCaseKeys';
import { CannedResponse } from '@/models/types';

export class CannedResponseService {
  static async index(searchKey: string): Promise<CannedResponseResponse> {
    const url = searchKey ? `canned_responses?search=${searchKey}` : 'canned_responses';
    const response = await apiService.get<CannedResponse[]>(url);
    const cannedResponses = response.data.map(transformCannedResponse);
    return {
      payload: cannedResponses,
    };
  }
}
