import { readdir } from 'node:fs/promises';
import { performance } from 'perf_hooks';

import type { DiscordClient } from 'classes/client';
import type { Event } from 'classes/event';

import { logger } from 'utils/logger';

export async function loadEvents(client: DiscordClient) {
  const startTime = performance.now();

  const path = process.cwd() + '/src/events/';
  const files = await readdir(path, { recursive: true });

  for (const file of files) {
    if (!file.endsWith('.ts') && !file.endsWith('.js')) continue;

    try {
      const imported: { default?: Event } = await import('file://' + path + file);
      if (!imported?.default?.options?.name) continue;

      if (imported.default?.options.once) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        client.once(imported.default.options.name, (...args: any[]) => imported.default?.options.execute(client, ...args));
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        client.on(imported.default.options.name, (...args: any[]) => imported.default?.options.execute(client, ...args));
      }
    } catch (err) {
      logger.error({ err }, `Error while loading event (${file})`);
      continue;
    }
  }

  const endTime = performance.now();
  logger.info(`[${client.cluster.id}] Loaded events (${Math.floor(endTime - startTime)}ms)`);
}
