'use server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { randomUUID } from 'node:crypto';
import { dashboardInput, dashboardMutation } from '@backend/orders/dashboard.ts';
import { ApiError } from '@backend/api/errors.ts';
import { orderDashboardSession } from './order-dashboard';

export async function orderDashboardAction(form:FormData) {
  let view='customer',orderId='';
  let message:string;
  try {
    const entries=[...form.entries()];
    if(entries.length>20||new Set(entries.map(([name])=>name)).size!==entries.length||entries.some(([,value])=>typeof value!=='string'||value.length>4096))throw new ApiError('VALIDATION_FAILED');
    const {view:requested,...fields}=Object.fromEntries(entries);
    const checked=dashboardInput({view:requested,orderId:fields.orderId});
    view=String(checked.view);orderId=String(checked.orderId);
    const command=dashboardMutation(fields);
    const session=await orderDashboardSession(true);
    if((await headers()).get('origin')!==session.origin)throw new ApiError('FORBIDDEN');
    await session.commands.run(command.action,command.input,session.identity,randomUUID());
    message='saved';
  }catch(error){message=error instanceof ApiError&&['CONFLICT','FORBIDDEN','UNAUTHENTICATED','VALIDATION_FAILED'].includes(error.code)?error.code:'unavailable';}
  redirect(`/${view}?${new URLSearchParams({...orderId?{orderId}:{},message})}`);
}
