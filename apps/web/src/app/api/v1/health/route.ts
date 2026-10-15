import { healthResponse } from '@backend/health.ts';
import { boundAppResponse, usesAppBinding } from '@backend/api/service-binding.ts';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export function GET(request: Request) { return usesAppBinding() ? boundAppResponse(request) : healthResponse(request); }
export const HEAD = GET;
export const POST = GET;
export const PUT = GET;
export const PATCH = GET;
export const DELETE = GET;
export const OPTIONS = GET;
