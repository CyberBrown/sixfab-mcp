import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createMcpHandler } from 'agents/mcp';
import type { Env } from './types.ts';
import { SixfabClient } from './sixfab-client.ts';

const ERROR_RESULT = (msg: string) => ({
  content: [{ type: 'text' as const, text: `Error: ${msg}` }],
  isError: true as const,
});

function validatePassphrase(provided: string | undefined, expected: string): ReturnType<typeof ERROR_RESULT> | null {
  if (!expected) return null; // no passphrase configured = dev mode
  if (!provided) return ERROR_RESULT('Passphrase required');
  if (provided !== expected) return ERROR_RESULT('Invalid passphrase');
  return null;
}

const passphraseParam = z.string().describe('Authentication passphrase');

export function createSixfabMcpHandler(env: Env) {
  const server = new McpServer({
    name: 'sixfab-mcp',
    version: '1.0.0',
  });

  const client = new SixfabClient(env);

  // ========================================
  // ASSETS
  // ========================================

  server.tool(
    'sixfab_list_assets',
    'List all Sixfab cellular IoT assets (devices) registered to your account',
    {
      passphrase: passphraseParam,
    },
    async ({ passphrase }) => {
      const authErr = validatePassphrase(passphrase, env.WRITE_PASSPHRASE);
      if (authErr) return authErr;
      try {
        const result = await client.listAssets();
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (e) {
        return ERROR_RESULT((e as Error).message);
      }
    }
  );

  server.tool(
    'sixfab_register_asset',
    'Register a new Sixfab device/asset using its registration token',
    {
      passphrase: passphraseParam,
      token: z.string().describe('Device registration token'),
      name: z.string().optional().describe('Friendly name for the device'),
    },
    async ({ passphrase, token, name }) => {
      const authErr = validatePassphrase(passphrase, env.WRITE_PASSPHRASE);
      if (authErr) return authErr;
      try {
        const result = await client.registerAsset({ token, name });
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (e) {
        return ERROR_RESULT((e as Error).message);
      }
    }
  );

  server.tool(
    'sixfab_get_asset',
    'Get detailed information about a specific Sixfab device/asset',
    {
      passphrase: passphraseParam,
      id: z.string().describe('Asset/device ID'),
    },
    async ({ passphrase, id }) => {
      const authErr = validatePassphrase(passphrase, env.WRITE_PASSPHRASE);
      if (authErr) return authErr;
      try {
        const result = await client.getAsset(id);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (e) {
        return ERROR_RESULT((e as Error).message);
      }
    }
  );

  server.tool(
    'sixfab_update_asset',
    'Update a Sixfab device/asset name or description',
    {
      passphrase: passphraseParam,
      id: z.string().describe('Asset/device ID'),
      name: z.string().optional().describe('New name for the device'),
      description: z.string().optional().describe('New description for the device'),
    },
    async ({ passphrase, id, name, description }) => {
      const authErr = validatePassphrase(passphrase, env.WRITE_PASSPHRASE);
      if (authErr) return authErr;
      try {
        const result = await client.updateAsset(id, { name, description });
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (e) {
        return ERROR_RESULT((e as Error).message);
      }
    }
  );

  // ========================================
  // SIM
  // ========================================

  server.tool(
    'sixfab_update_sim',
    'Update SIM settings (APN, PIN) for a Sixfab device',
    {
      passphrase: passphraseParam,
      id: z.string().describe('Asset/device ID'),
      apn: z.string().optional().describe('APN (Access Point Name) for the SIM'),
      pin: z.string().optional().describe('SIM PIN code'),
    },
    async ({ passphrase, id, apn, pin }) => {
      const authErr = validatePassphrase(passphrase, env.WRITE_PASSPHRASE);
      if (authErr) return authErr;
      try {
        const result = await client.updateSim(id, { apn, pin });
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (e) {
        return ERROR_RESULT((e as Error).message);
      }
    }
  );

  server.tool(
    'sixfab_get_sim_usage',
    'Get SIM data usage statistics for a Sixfab device',
    {
      passphrase: passphraseParam,
      id: z.string().describe('Asset/device ID'),
      start: z.string().optional().describe('Start date for usage period (ISO 8601)'),
      end: z.string().optional().describe('End date for usage period (ISO 8601)'),
      interval: z.string().optional().describe('Aggregation interval (e.g. "daily", "hourly")'),
    },
    async ({ passphrase, id, start, end, interval }) => {
      const authErr = validatePassphrase(passphrase, env.WRITE_PASSPHRASE);
      if (authErr) return authErr;
      try {
        const result = await client.getSimUsage(id, { start, end, interval });
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (e) {
        return ERROR_RESULT((e as Error).message);
      }
    }
  );

  // ========================================
  // DEVICE STATUS
  // ========================================

  server.tool(
    'sixfab_get_device_status',
    'Get current status of a Sixfab device (online/offline, uptime, system info)',
    {
      passphrase: passphraseParam,
      id: z.string().describe('Asset/device ID'),
    },
    async ({ passphrase, id }) => {
      const authErr = validatePassphrase(passphrase, env.WRITE_PASSPHRASE);
      if (authErr) return authErr;
      try {
        const result = await client.getDeviceStatus(id);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (e) {
        return ERROR_RESULT((e as Error).message);
      }
    }
  );

  // ========================================
  // CONTAINERS
  // ========================================

  server.tool(
    'sixfab_list_containers',
    'List all Docker containers running on a Sixfab device',
    {
      passphrase: passphraseParam,
      id: z.string().describe('Asset/device ID'),
    },
    async ({ passphrase, id }) => {
      const authErr = validatePassphrase(passphrase, env.WRITE_PASSPHRASE);
      if (authErr) return authErr;
      try {
        const result = await client.listContainers(id);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (e) {
        return ERROR_RESULT((e as Error).message);
      }
    }
  );

  server.tool(
    'sixfab_deploy_container',
    'Deploy a new Docker container to a Sixfab device',
    {
      passphrase: passphraseParam,
      id: z.string().describe('Asset/device ID'),
      image: z.string().describe('Docker image to deploy (e.g. "nginx:latest")'),
      name: z.string().describe('Container name'),
      ports: z.record(z.string(), z.string()).optional().describe('Port mappings (e.g. {"80": "8080"})'),
      env: z.record(z.string(), z.string()).optional().describe('Environment variables'),
    },
    async ({ passphrase, id, image, name, ports, env: containerEnv }) => {
      const authErr = validatePassphrase(passphrase, env.WRITE_PASSPHRASE);
      if (authErr) return authErr;
      try {
        const result = await client.deployContainer(id, { image, name, ports, env: containerEnv });
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (e) {
        return ERROR_RESULT((e as Error).message);
      }
    }
  );

  server.tool(
    'sixfab_delete_container',
    'Delete a Docker container from a Sixfab device',
    {
      passphrase: passphraseParam,
      id: z.string().describe('Asset/device ID'),
      containerId: z.string().describe('Container ID to delete'),
    },
    async ({ passphrase, id, containerId }) => {
      const authErr = validatePassphrase(passphrase, env.WRITE_PASSPHRASE);
      if (authErr) return authErr;
      try {
        const result = await client.deleteContainer(id, containerId);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (e) {
        return ERROR_RESULT((e as Error).message);
      }
    }
  );

  server.tool(
    'sixfab_update_container',
    'Update a Docker container on a Sixfab device (start, stop, restart)',
    {
      passphrase: passphraseParam,
      id: z.string().describe('Asset/device ID'),
      containerId: z.string().describe('Container ID'),
      action: z.string().describe('Action to perform: "start", "stop", or "restart"'),
    },
    async ({ passphrase, id, containerId, action }) => {
      const authErr = validatePassphrase(passphrase, env.WRITE_PASSPHRASE);
      if (authErr) return authErr;
      try {
        const result = await client.updateContainer(id, containerId, { action });
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (e) {
        return ERROR_RESULT((e as Error).message);
      }
    }
  );

  // ========================================
  // eSIM
  // ========================================

  server.tool(
    'sixfab_get_esim_profiles',
    'Get eSIM profiles installed on a Sixfab device',
    {
      passphrase: passphraseParam,
      id: z.string().describe('Asset/device ID'),
    },
    async ({ passphrase, id }) => {
      const authErr = validatePassphrase(passphrase, env.WRITE_PASSPHRASE);
      if (authErr) return authErr;
      try {
        const result = await client.getEsimProfiles(id);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (e) {
        return ERROR_RESULT((e as Error).message);
      }
    }
  );

  server.tool(
    'sixfab_download_esim_profile',
    'Download a new eSIM profile to a Sixfab device',
    {
      passphrase: passphraseParam,
      id: z.string().describe('Asset/device ID'),
      activation_code: z.string().describe('eSIM activation code (QR code content)'),
    },
    async ({ passphrase, id, activation_code }) => {
      const authErr = validatePassphrase(passphrase, env.WRITE_PASSPHRASE);
      if (authErr) return authErr;
      try {
        const result = await client.downloadEsimProfile(id, { activation_code });
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (e) {
        return ERROR_RESULT((e as Error).message);
      }
    }
  );

  server.tool(
    'sixfab_switch_esim_profile',
    'Switch the active eSIM profile on a Sixfab device',
    {
      passphrase: passphraseParam,
      id: z.string().describe('Asset/device ID'),
      iccid: z.string().describe('ICCID of the eSIM profile to activate'),
    },
    async ({ passphrase, id, iccid }) => {
      const authErr = validatePassphrase(passphrase, env.WRITE_PASSPHRASE);
      if (authErr) return authErr;
      try {
        const result = await client.switchEsimProfile(id, { iccid });
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (e) {
        return ERROR_RESULT((e as Error).message);
      }
    }
  );

  // ========================================
  // LOCATION
  // ========================================

  server.tool(
    'sixfab_get_device_location',
    'Get the GPS/cell-tower location of a Sixfab device',
    {
      passphrase: passphraseParam,
      id: z.string().describe('Asset/device ID'),
    },
    async ({ passphrase, id }) => {
      const authErr = validatePassphrase(passphrase, env.WRITE_PASSPHRASE);
      if (authErr) return authErr;
      try {
        const result = await client.getDeviceLocation(id);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (e) {
        return ERROR_RESULT((e as Error).message);
      }
    }
  );

  // ========================================
  // NETWORK
  // ========================================

  server.tool(
    'sixfab_get_network_monitor',
    'Get network monitoring data for a Sixfab device (signal strength, connection type)',
    {
      passphrase: passphraseParam,
      id: z.string().describe('Asset/device ID'),
    },
    async ({ passphrase, id }) => {
      const authErr = validatePassphrase(passphrase, env.WRITE_PASSPHRASE);
      if (authErr) return authErr;
      try {
        const result = await client.getNetworkMonitor(id);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (e) {
        return ERROR_RESULT((e as Error).message);
      }
    }
  );

  server.tool(
    'sixfab_get_interface_priorities',
    'Get network interface priority order for a Sixfab device',
    {
      passphrase: passphraseParam,
      id: z.string().describe('Asset/device ID'),
    },
    async ({ passphrase, id }) => {
      const authErr = validatePassphrase(passphrase, env.WRITE_PASSPHRASE);
      if (authErr) return authErr;
      try {
        const result = await client.getInterfacePriorities(id);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (e) {
        return ERROR_RESULT((e as Error).message);
      }
    }
  );

  server.tool(
    'sixfab_set_interface_priorities',
    'Set network interface priority order for a Sixfab device (failover configuration)',
    {
      passphrase: passphraseParam,
      id: z.string().describe('Asset/device ID'),
      priorities: z.array(z.string()).describe('Ordered list of interface names (highest priority first)'),
    },
    async ({ passphrase, id, priorities }) => {
      const authErr = validatePassphrase(passphrase, env.WRITE_PASSPHRASE);
      if (authErr) return authErr;
      try {
        const result = await client.setInterfacePriorities(id, { priorities });
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (e) {
        return ERROR_RESULT((e as Error).message);
      }
    }
  );

  // ========================================
  // MONITORING
  // ========================================

  server.tool(
    'sixfab_get_device_monitor',
    'Get device monitoring metrics (CPU, memory, disk, temperature) for a Sixfab device',
    {
      passphrase: passphraseParam,
      id: z.string().describe('Asset/device ID'),
    },
    async ({ passphrase, id }) => {
      const authErr = validatePassphrase(passphrase, env.WRITE_PASSPHRASE);
      if (authErr) return authErr;
      try {
        const result = await client.getDeviceMonitor(id);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (e) {
        return ERROR_RESULT((e as Error).message);
      }
    }
  );

  server.tool(
    'sixfab_get_modem_monitor',
    'Get cellular modem monitoring data (signal quality, band, carrier) for a Sixfab device',
    {
      passphrase: passphraseParam,
      id: z.string().describe('Asset/device ID'),
    },
    async ({ passphrase, id }) => {
      const authErr = validatePassphrase(passphrase, env.WRITE_PASSPHRASE);
      if (authErr) return authErr;
      try {
        const result = await client.getModemMonitor(id);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (e) {
        return ERROR_RESULT((e as Error).message);
      }
    }
  );

  // ========================================
  // REMOTE TERMINAL
  // ========================================

  server.tool(
    'sixfab_get_remote_terminal_code',
    'Get a one-time code to access the remote terminal (SSH) of a Sixfab device',
    {
      passphrase: passphraseParam,
      id: z.string().describe('Asset/device ID'),
    },
    async ({ passphrase, id }) => {
      const authErr = validatePassphrase(passphrase, env.WRITE_PASSPHRASE);
      if (authErr) return authErr;
      try {
        const result = await client.getRemoteTerminalCode(id);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (e) {
        return ERROR_RESULT((e as Error).message);
      }
    }
  );

  // ========================================
  // NETWORKS
  // ========================================

  server.tool(
    'sixfab_list_networks',
    'List all Sixfab networks (private cellular networks) in your account',
    {
      passphrase: passphraseParam,
    },
    async ({ passphrase }) => {
      const authErr = validatePassphrase(passphrase, env.WRITE_PASSPHRASE);
      if (authErr) return authErr;
      try {
        const result = await client.listNetworks();
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (e) {
        return ERROR_RESULT((e as Error).message);
      }
    }
  );

  return createMcpHandler(server);
}
