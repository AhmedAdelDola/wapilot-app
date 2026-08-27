import { apiService } from '@/models/services/APIService';
import type { CustomAttributeResponse } from '@/viewmodels/store/custom-attribute/customAttributeTypes';
import { transformCustomAttribute } from '@/utils/camelCaseKeys';
import { CustomAttribute } from '@/models/types';

export class CustomAttributeService {
  static async index(): Promise<CustomAttributeResponse> {
    const response = await apiService.get<CustomAttribute[]>('custom_attribute_definitions');
    const customAttributes = response.data.map(transformCustomAttribute);
    return {
      payload: customAttributes,
    };
  }
}
