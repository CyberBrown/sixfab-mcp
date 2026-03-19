import type { Env } from './types.ts';

interface SixfabApiResponse {
  status?: string;
  data?: unknown;
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
      const msg = json.message || `HTTP ${response.status}`;
      throw new Error(`Sixfab API error: ${msg} (status ${response.status})`);
    }

    return json;
  }

  // ========================================
  // ASSETS
  // ========================================

  async listAssets() {
    return this.request('GET', '/asset/');
  }

  async registerAsset(data: { token: string; name?: string }) {
    return this.request('POST', '/asset/', undefined, data);
  }

  async getAsset(id: string) {
    return this.request('GET', `/asset/${encodeURIComponent(id)}/`);
  }

  async updateAsset(id: string, data: { name?: string; description?: string }) {
    return this.request('PUT', `/asset/${encodeURIComponent(id)}/`, undefined, data);
  }

  // ========================================
  // SIM
  // ========================================

  async updateSim(id: string, data: { apn?: string; pin?: string }) {
    return this.request('PUT', `/asset/${encodeURIComponent(id)}/sim/`, undefined, data);
  }

  async getSimUsage(id: string, params?: { start?: string; end?: string; interval?: string }) {
    return this.request('GET', `/asset/${encodeURIComponent(id)}/sim/usage/`, params);
  }

  // ========================================
  // DEVICE STATUS
  // ========================================

  async getDeviceStatus(id: string) {
    return this.request('GET', `/asset/${encodeURIComponent(id)}/status/`);
  }

  // ========================================
  // CONTAINERS
  // ========================================

  async listContainers(id: string) {
    return this.request('GET', `/asset/${encodeURIComponent(id)}/container/`);
  }

  async deployContainer(id: string, data: { image: string; name: string; ports?: Record<string, string>; env?: Record<string, string> }) {
    return this.request('POST', `/asset/${encodeURIComponent(id)}/container/`, undefined, data);
  }

  async deleteContainer(id: string, containerId: string) {
    return this.request('DELETE', `/asset/${encodeURIComponent(id)}/container/${encodeURIComponent(containerId)}/`);
  }

  async updateContainer(id: string, containerId: string, data: { action: string }) {
    return this.request('PUT', `/asset/${encodeURIComponent(id)}/container/${encodeURIComponent(containerId)}/`, undefined, data);
  }

  // ========================================
  // eSIM
  // ========================================

  async getEsimProfiles(id: string) {
    return this.request('GET', `/asset/${encodeURIComponent(id)}/esim/`);
  }

  async downloadEsimProfile(id: string, data: { activation_code: string }) {
    return this.request('POST', `/asset/${encodeURIComponent(id)}/esim/download/`, undefined, data);
  }

  async switchEsimProfile(id: string, data: { iccid: string }) {
    return this.request('POST', `/asset/${encodeURIComponent(id)}/esim/switch/`, undefined, data);
  }

  // ========================================
  // LOCATION
  // ========================================

  async getDeviceLocation(id: string) {
    return this.request('GET', `/asset/${encodeURIComponent(id)}/location/`);
  }

  // ========================================
  // NETWORK
  // ========================================

  async getNetworkMonitor(id: string) {
    return this.request('GET', `/asset/${encodeURIComponent(id)}/network/monitor/`);
  }

  async getInterfacePriorities(id: string) {
    return this.request('GET', `/asset/${encodeURIComponent(id)}/network/priority/`);
  }

  async setInterfacePriorities(id: string, data: { priorities: string[] }) {
    return this.request('PUT', `/asset/${encodeURIComponent(id)}/network/priority/`, undefined, data);
  }

  // ========================================
  // MONITORING
  // ========================================

  async getDeviceMonitor(id: string) {
    return this.request('GET', `/asset/${encodeURIComponent(id)}/monitor/device/`);
  }

  async getModemMonitor(id: string) {
    return this.request('GET', `/asset/${encodeURIComponent(id)}/monitor/modem/`);
  }

  // ========================================
  // REMOTE TERMINAL
  // ========================================

  async getRemoteTerminalCode(id: string) {
    return this.request('GET', `/asset/${encodeURIComponent(id)}/remote-terminal/`);
  }

  // ========================================
  // NETWORKS
  // ========================================

  async listNetworks() {
    return this.request('GET', '/network/');
  }
}
