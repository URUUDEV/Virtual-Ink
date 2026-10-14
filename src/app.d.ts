import type { Server } from 'node:http';
import type { AccessDependencies } from './backend/identity/routes.ts';
import type { RuntimeEvent } from './backend/api/responses.ts';

/** Type contract for the independent JavaScript HTTP adapter. */
export function createApp(options?: {
  logger?: (event: RuntimeEvent) => void;
  access?: AccessDependencies;
}): Server;
