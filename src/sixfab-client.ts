import type { Env } from './types.ts';

interface SixfabApiResponse {
  status?: string;
  data?: unknown;
  detail?: unknown;
  message?: string;
  [key: string]: unknown;
}

export class SixfabClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(env: Env) {
    this.baseUrl = env.SIXFAB_API_BASE;
    this.apiKey = env.SIXFAB_API_KEY;
  }

  private async request(
    method: string,
    path: string,
    params?: Record<string, string | undefined>,
    body?: unknown
  ): Promise<unknown> {
    const url = new URL(`${this.baseUrl}${path}`);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          url.searchParams.set(key, value);
        }
      }
    }

    const headers: Record<string, string> = {
      'x-api-key': this.apiKey,
      'Accept': 'application/json',
    };

    const init: RequestInit = { method, headers };

    if (body) {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(body);
    }

    const response = await fetch(url.toString(), init);
    const json = await response.json() as SixfabApiResponse;

    if (!response.ok) {
      const msg = json.message || json.detail as string || `HTTP ${response.status}`;
      throw new Error(`Sixfab API error: ${msg} (status ${response.status})`);
    }

    return json;
  }

  // ========================================
  // ASSETS
  // ========================================

  async listAssets() {
    return this.request('GET', '/assets');
  }

  async registerAsset(data: { token: string; name?: string }) {
    return this.request('POST', '/assets', undefined, data);
  }

  async getAsset(id: string) {
    return this.request('GET', `/assets/${encodeURIComponent(id)}`);
  }

  async updateAsset(id: string, data: { name?: string; description?: string }) {
    return this.request('PATCH', `/assets/${encodeURIComponent(id)}`, undefined, data);
  }

  // ========================================
  // SIM
  // ========================================

  async updateSim(id: string, data: { apn?: string; pin?: string }) {
    return this.request('PATCH', `/assets/${encodeURIComponent(id)}/sim`, undefined, data);
  }

  async getSimUsage(id: string, params?: { start?: string; end?: string; interval?: string }) {
    return this.request('GET', `/assets/${encodeURIComponent(id)}/sim/usages`, params);
  }

  // ========================================
  // DEVICE STATUS (via ALPON)
  // ========================================

  async getDeviceStatus(id: string) {
    return this.request('GET', `/assets/${encodeURIComponent(id)}/alpon`);
  }

  // ========================================
  // CONTAINERS
  // ========================================

  async listContainers(id: string) {
    return this.request('GET', `/assets/${encodeURIComponent(id)}/alpon/containers`);
  }

  async deployContainer(id: string, data: { image: string; name: string; ports?: Record<string, string>; env?: Record<string, string> }) {
    return this.request('POST', `/assets/${encodeURIComponent(id)}/alpon/containers`, undefined, data);
  }

  async deleteContainer(id: string, containerName: string) {
    return this.request('DELETE', `/assets/${encodeURIComponent(id)}/alpon/containers/${encodeURIComponent(containerName)}`);
  }

  async updateContainer(id: string, containerName: string, data: { action: string }) {
    return this.request('PATCH', `/assets/${encodeURIComponent(id)}/alpon/containers/${encodeURIComponent(containerName)}`, undefined, data);
  }

  // ========================================
  // eSIM
  // ========================================

  async getEsimProfiles(id: string) {
    return this.request('GET', `/assets/${encodeURIComponent(id)}/alpon/esim`);
  }

  async downloadEsimProfile(id: string, data: { activation_code: string }) {
    return this.request('POST', `/assets/${encodeURIComponent(id)}/alpon/esim`, undefined, data);
  }

  async switchEsimProfile(id: string, data: { iccid: string }) {
    return this.request('PATCH', `/assets/${encodeURIComponent(id)}/alpon/esim`, undefined, data);
  }

  // ========================================
  // LOCATION
  // ========================================

  async getDeviceLocation(id: string) {
    return this.request('GET', `/assets/${encodeURIComponent(id)}/alpon/location`);
  }

  // ========================================
  // NETWORK
  // ========================================

  async getNetworkMonitor(id: string) {
    return this.request('GET', `/assets/${encodeURIComponent(id)}/alpon/network`);
  }

  async getInterfacePriorities(id: string) {
    return this.request('GET', `/assets/${encodeURIComponent(id)}/alpon/network_priority`);
  }

  async setInterfacePriorities(id: string, data: { priorities: string[] }) {
    return this.request('PATCH', `/assets/${encodeURIComponent(id)}/alpon/network_priority`, undefined, data);
  }

  // ========================================
  // MONITORING
  // ========================================

  async getDeviceMonitor(id: string) {
    return this.request('GET', `/assets/${encodeURIComponent(id)}/alpon/device`);
  }

  async getModemMonitor(id: string) {
    return this.request('GET', `/assets/${encodeURIComponent(id)}/alpon/modem`);
  }

  // ========================================
  // REMOTE TERMINAL
  // ========================================

  async getRemoteTerminalCode(id: string) {
    return this.request('GET', `/assets/${encodeURIComponent(id)}/alpon/terminal_access_code`);
  }

  // ========================================
  // NETWORKS
  // ========================================

  async listNetworks() {
    return this.request('GET', '/networks');
  }
}
