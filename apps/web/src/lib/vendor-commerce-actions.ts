'use server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { randomUUID } from 'node:crypto';
import { ApiError } from '@backend/api/errors.ts';
import { commerceFormInput } from '@backend/vendors/commerce.ts';
import { orderDashboardSession } from './order-dashboard';

export async function vendorCommerceAction(form: FormData) {
  let vendorId = '', message: string;
  try {
    const checked = commerceFormInput([...form.entries()]);
    vendorId = String(checked.input.vendorId);
    const session = await orderDashboardSession(true);
    if ((await headers()).get('origin') !== session.origin) throw new ApiError('FORBIDDEN');
    await session.commerce.run(checked.action, checked.input, session.identity, randomUUID());
    message = 'saved';
  } catch (error) {
    message = error instanceof ApiError && ['CONFLICT', 'FORBIDDEN', 'UNAUTHENTICATED', 'VALIDATION_FAILED', 'NOT_FOUND'].includes(error.code) ? error.code : 'unavailable';
  }
  redirect(`/vendor/pricing?${new URLSearchParams({ ...vendorId ? { vendorId } : {}, message })}`);
}
