// lib/limits/device.ts
import { cookies } from 'next/headers';
import { randomUUID, createHash } from 'node:crypto';

const COOKIE_NAME = 'mt_device';

export function getOrSetDeviceKey() {
  const jar = cookies();
  let val = jar.get(COOKIE_NAME)?.value;

  if (!val) {
    // 尝试用 UA + 随机生成一个稳定 ID（不追踪个人，仅限额度）
    const ua = jar.get('User-Agent')?.value || '';
    val = createHash('sha256').update(ua + '|' + randomUUID()).digest('hex');
    jar.set(COOKIE_NAME, val, {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 365 // 1年
    });
  }

  return { keyType: 'device' as const, key: val };
}
