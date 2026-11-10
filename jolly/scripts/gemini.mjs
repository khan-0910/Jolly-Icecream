// Google Gemini image generation (Nano Banana, gemini-2.5-flash-image). Free tier with an AI Studio key.
// Reads GEMINI_API_KEY from the environment or jolly/.env.local. The key is never printed.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './kie.mjs';

export const GEMINI_IMAGE_MODEL = 'gemini-2.5-flash-image';

export function loadGeminiKey() {
  if (process.env.GEMINI_API_KEY?.trim()) return process.env.GEMINI_API_KEY.trim();
  const envFile = path.join(ROOT, '.env.local');
  if (fs.existsSync(envFile)) {
    const line = fs
      .readFileSync(envFile, 'utf8')
      .split(/\r?\n/)
      .find((l) => l.startsWith('GEMINI_API_KEY='));
    const value = line ? line.slice('GEMINI_API_KEY='.length).trim().replace(/^["']|["']$/g, '') : '';
    if (value) return value;
  }
  throw new Error('No Gemini key found. Add a line GEMINI_API_KEY=... to jolly/.env.local');
}

export async function geminiImage(key, prompt, { aspectRatio = '4:5', model = GEMINI_IMAGE_MODEL } = {}) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio } }
    })
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${json.error?.message || 'request failed'}`);
  const parts = json.candidates?.[0]?.content?.parts || [];
  const img = parts.find((p) => p.inlineData?.data);
  if (!img) {
    const why = json.candidates?.[0]?.finishReason || json.promptFeedback?.blockReason || 'no image returned';
    throw new Error(`Gemini returned no image (${why})`);
  }
  return { buffer: Buffer.from(img.inlineData.data, 'base64'), mime: img.inlineData.mimeType || 'image/png' };
}
