import { apiService } from '@/models/services/APIService';
import type { AssignableAgentAPIResponse, AssignableAgentResponse } from '@/viewmodels/store/assignable-agent/assignableAgentTypes';
import { transformInboxAgent } from '@/utils/camelCaseKeys';

export class AssignableAgentService {
  static async getAgents(inboxIds: number[]): Promise<AssignableAgentResponse> {
    const response = await apiService.get<AssignableAgentAPIResponse>('assignable_agents', {
      params: {
        'inbox_ids[]': inboxIds,
      },
    });

    const inboxesAgents = response.data.payload.map(transformInboxAgent);
    return {
      agents: inboxesAgents,
      inboxIds,
    };
  }
}
