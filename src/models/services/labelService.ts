import { apiService } from '@/models/services/APIService';
import type { LabelResponse } from '@/viewmodels/store/label/labelTypes';
import { transformLabel } from '@/utils/camelCaseKeys';

export class LabelService {
  static async index(): Promise<LabelResponse> {
    const response = await apiService.get<LabelResponse>('labels');
    const labels = response.data.payload.map(transformLabel);
    return {
      payload: labels,
    };
  }
}
