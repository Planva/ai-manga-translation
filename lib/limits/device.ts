// lib/limits/device.ts
import { cookies, headers } from 'next/headers';

const COOKIE_NAME = 'mt_device';

// 将字符串做 SHA-256 并转成 hex（Node / Edge 通用）
async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function getOrSetDeviceKey() {
  const jar = await cookies();             // ← 必须 await
  let val = jar.get(COOKIE_NAME)?.value;

  if (!val) {
    const hdrs = await headers();          // ← 同样需要 await
    const ua = hdrs.get('user-agent') ?? '';

    // 使用 UA + 随机 UUID 生成一个稳定 ID（仅用于额度，不做个人追踪）
    const uuid = globalThis.crypto?.randomUUID?.() 
      ?? Math.random().toString(36).slice(2); // 极端环境兜底
    val = await sha256Hex(`${ua}|${uuid}`);

    jar.set(COOKIE_NAME, val, {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 年
    });
  }

  return { keyType: 'device' as const, key: val };
}
