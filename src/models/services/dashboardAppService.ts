import { apiService } from '@/models/services/APIService';
import type { DashboardAppResponse } from '@/viewmodels/store/dashboard-app/dashboardAppTypes';
import { transformDashboardApp } from '@/utils/camelCaseKeys';
import { DashboardApp } from '@/models/types';

export class DashboardAppService {
  static async index(): Promise<DashboardAppResponse> {
    const response = await apiService.get<DashboardApp[]>('dashboard_apps');
    const dashboardApps = response.data.map(transformDashboardApp);
    return {
      payload: dashboardApps,
    };
  }
}
