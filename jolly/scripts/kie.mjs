// Minimal kie.ai client, the same createTask -> recordInfo flow that Open-Higgsfield-AI uses.
// Reads KIE_API_KEY from the environment or from jolly/.env.local. The key is never printed.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'https://api.kie.ai';

export function loadKey() {
  if (process.env.KIE_API_KEY) return process.env.KIE_API_KEY.trim();
  const envFile = path.join(ROOT, '.env.local');
  if (fs.existsSync(envFile)) {
    const line = fs
      .readFileSync(envFile, 'utf8')
      .split(/\r?\n/)
      .find((l) => l.startsWith('KIE_API_KEY='));
    const value = line ? line.slice('KIE_API_KEY='.length).trim().replace(/^["']|["']$/g, '') : '';
    if (value) return value;
  }
  throw new Error('No kie.ai key found. Add a line KIE_API_KEY=... to jolly/.env.local');
}

async function call(key, method, url, body) {
  const res = await fetch(`${BASE}${url}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`kie.ai ${res.status}: ${text.slice(0, 200)}`);
  }
  if (!res.ok || (json.code && json.code !== 200)) {
    throw new Error(`kie.ai ${json.code || res.status}: ${json.msg || text.slice(0, 200)}`);
  }
  return json.data ?? json;
}

export async function credits(key) {
  return call(key, 'GET', '/api/v1/chat/credit');
}

export async function createTask(key, model, input) {
  const data = await call(key, 'POST', '/api/v1/jobs/createTask', { model, input });
  if (!data?.taskId) throw new Error(`kie.ai returned no taskId for ${model}`);
  return data.taskId;
}

export async function waitForTask(key, taskId, { interval = 4000, timeoutMs = 15 * 60 * 1000, onTick } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    await new Promise((r) => setTimeout(r, interval));
    let data;
    try {
      data = await call(key, 'GET', `/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`);
    } catch (e) {
      onTick?.(`poll error, retrying: ${e.message}`);
      continue;
    }
    const state = String(data.state || '').toLowerCase();
    onTick?.(state || 'waiting');
    if (state === 'success') {
      let result = data.resultJson;
      if (typeof result === 'string') {
        try {
          result = JSON.parse(result);
        } catch {
          result = {};
        }
      }
      const urls = result?.resultUrls || data.response?.resultUrls || data.resultUrls || [];
      if (!urls.length) throw new Error(`Task ${taskId} succeeded but returned no file`);
      return urls;
    }
    if (state === 'fail' || state === 'error') throw new Error(`Task ${taskId} failed: ${data.failMsg || 'no reason given'}`);
  }
  throw new Error(`Task ${taskId} timed out`);
}

export async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed ${res.status} for ${url}`);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  return dest;
}

export { ROOT };
