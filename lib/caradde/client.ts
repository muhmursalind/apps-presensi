import { decrypt } from '@/lib/auth/crypto';
import type { EmployeeDoc } from '@/lib/models/Employee';
import type { CaraddeResponse, CaraddeLoginData } from './types';

function getBaseUrl(): string {
  const base = process.env.CARADDE_API_BASE_URL;
  if (!base) {
    throw new Error('CARADDE_API_BASE_URL environment variable is required');
  }
  return base.replace(/\/+$/, '');
}

export interface CaraddeCallResult<T = unknown> {
  status: number;
  json: CaraddeResponse<T> | { meta?: { code: number; status: string; message: string }; data?: unknown } | null;
}

export async function loginCaradde(
  nomorInduk: string,
  password: string,
  deviceId: string
): Promise<CaraddeCallResult<CaraddeLoginData>> {
  const res = await fetch(`${getBaseUrl()}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      nomor_induk: nomorInduk,
      password,
      device_name: 'Android Device',
      device_id: deviceId,
      fcm_token: null,
    }),
    cache: 'no-store',
  });
  let json = null;
  try { json = await res.json(); } catch { /* empty */ }
  return { status: res.status, json };
}

function isUnauthenticated(result: CaraddeCallResult): boolean {
  if (result.status === 401 || result.status === 403) return true;
  const code = result.json?.meta?.code;
  const msg = (result.json?.meta?.message || '').toString().toLowerCase();
  if (code === 401 || code === 403) return true;
  if (msg.includes('unauthenticated') || msg.includes('unauthorized')) return true;
  return false;
}

async function rawCall<T>(
  authorization: string,
  method: string,
  path: string,
  body?: BodyInit | object | undefined
): Promise<CaraddeCallResult<T>> {
  const headers: Record<string, string> = {
    Authorization: authorization,
    Accept: 'application/json',
  };
  let finalBody: BodyInit | undefined;
  if (body instanceof FormData) {
    finalBody = body;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    finalBody = JSON.stringify(body);
  }
  const res = await fetch(`${getBaseUrl()}${path}`, { method, headers, body: finalBody, cache: 'no-store' });
  let json = null;
  try { json = await res.json(); } catch { /* empty */ }
  return { status: res.status, json };
}

/**
 * Call Caradde API on behalf of an Employee. Automatically refreshes the token
 * if Unauthenticated (401/403) by re-login using stored credentials.
 */
export async function caraddeCall<T = unknown>(
  employee: EmployeeDoc & { save: () => Promise<unknown> },
  method: string,
  path: string,
  body?: BodyInit | object
): Promise<CaraddeCallResult<T>> {
  if (!employee.authorization) {
    const pwd = decrypt(employee.passwordEnc);
    const login = await loginCaradde(employee.nomorInduk, pwd, employee.deviceId);
    if (login.json?.meta?.code === 200 && login.json.data) {
      const data = login.json.data as CaraddeLoginData;
      employee.authorization = `${data.token_type} ${data.access_token}`;
      employee.caraddeUserId = data.user.id;
      employee.employeeName = data.user.name;
      employee.lastLogin = new Date();
      await employee.save();
    } else {
      return login as CaraddeCallResult<T>;
    }
  }

  let result = await rawCall<T>(employee.authorization!, method, path, body);
  if (isUnauthenticated(result)) {
    const pwd = decrypt(employee.passwordEnc);
    const login = await loginCaradde(employee.nomorInduk, pwd, employee.deviceId);
    if (login.json?.meta?.code === 200 && login.json.data) {
      const data = login.json.data as CaraddeLoginData;
      employee.authorization = `${data.token_type} ${data.access_token}`;
      employee.caraddeUserId = data.user.id;
      employee.employeeName = data.user.name;
      employee.lastLogin = new Date();
      await employee.save();
      if (!(body instanceof FormData)) {
        result = await rawCall<T>(employee.authorization!, method, path, body);
      }
    }
  }
  return result;
}
