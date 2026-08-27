import type { Team } from '@/models/types';
import { apiService } from '@/models/services/APIService';
import { transformTeam } from '@/utils/camelCaseKeys';

export class TeamService {
  static async getTeams(): Promise<Team[]> {
    const response = await apiService.get<Team[]>('teams');
    const teams = response.data.map(transformTeam);
    return teams;
  }
}
