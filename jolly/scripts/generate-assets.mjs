// Generates Jolly's flavour cones and hero video on kie.ai and saves them into public/assets.
//   node scripts/generate-assets.mjs            -> everything
//   node scripts/generate-assets.mjs --only=vanilla,hero
//   node scripts/generate-assets.mjs --dry      -> print what would be sent, spend nothing
//   node scripts/generate-assets.mjs --provider=gemini  -> flavour cones only, on the free Gemini tier
import path from 'node:path';
import fs from 'node:fs';
import { loadKey, createTask, waitForTask, download, ROOT } from './kie.mjs';
import { loadGeminiKey, geminiImage, GEMINI_IMAGE_MODEL } from './gemini.mjs';

const STYLE =
  'Studio product photograph, a single ice cream cone floating upright and centred, three-quarter view from slightly above, ' +
  'soft diffused daylight, gentle soft shadow, the whole cone in frame with generous empty space around it, ' +
  'photographed on a seamless flat solid backdrop of exactly {BG}, no gradient, no props, no hands, no text, no logo.';

const IMAGE_MODEL = 'nano-banana-pro';
const VIDEO_MODEL = 'bytedance/seedance-2';

const JOBS = [
  {
    id: 'vanilla',
    bg: '#FFF4CC pastel butter yellow',
    prompt:
      'One generous scoop of vanilla bean ice cream, creamy ivory with tiny black vanilla bean specks, a soft melt just starting at the rim of a crisp golden waffle cone.'
  },
  {
    id: 'cookies',
    bg: '#E7E4EE pale lilac grey',
    prompt:
      'One scoop of white cookies and cream ice cream packed with big chunks and fine crumbs of dark chocolate sandwich cookie, in a crisp golden waffle cone.'
  },
  {
    id: 'strawberry',
    bg: '#FFD3DD pastel strawberry pink',
    prompt:
      'One scoop of pastel pink strawberry ice cream with small pieces of real strawberry and a glossy ripple of strawberry sauce, in a crisp golden waffle cone.'
  },
  {
    id: 'irish',
    bg: '#EBD9C4 soft latte beige',
    prompt:
      'One scoop of smooth latte-coloured Irish cream ice cream with a glossy caramel-coffee ribbon swirled through it, in a crisp golden waffle cone.'
  },
  {
    id: 'guava',
    bg: '#FFC7BA pastel coral pink',
    prompt:
      'One scoop of coral-pink guava ice cream lightly dusted with fine red chilli powder, topped with a thin slice of fresh pink guava with its green skin, in a crisp golden waffle cone.'
  }
];

const HERO = {
  id: 'hero',
  prompt:
    'Macro slow-motion shot of a single scoop of pastel pink strawberry ice cream in a golden waffle cone, slowly softening, ' +
    'one glossy pink drip running down the side of the cone. Soft studio light, shallow depth of field, dreamy pastel mint green ' +
    'backdrop. Locked-off camera with a very slight push-in. Calm, seamless loop. No text, no hands, no people.'
};

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const onlyArg = args.find((a) => a.startsWith('--only='));
const only = onlyArg ? onlyArg.slice(7).split(',') : null;
const wanted = (id) => !only || only.includes(id);
const providerArg = args.find((a) => a.startsWith('--provider='));
const provider = providerArg ? providerArg.slice(11) : 'kie';

// Free route: Gemini makes the five cones one after another (gentle on free-tier rate limits).
async function runGemini() {
  const jobs = JOBS.filter((j) => wanted(j.id));
  if (wanted('hero') && only) console.log('[hero] skipped: Gemini makes images only, the SVG hero stays.');
  if (dry) {
    for (const j of jobs) console.log(`${j.id} -> ${GEMINI_IMAGE_MODEL}
${imageInput(j).prompt}
`);
    return;
  }
  const key = loadGeminiKey();
  let failed = 0;
  for (const j of jobs) {
    try {
      console.log(`[${j.id}] generating`);
      const { buffer, mime } = await geminiImage(key, imageInput(j).prompt, { aspectRatio: '4:5' });
      const ext = mime.includes('jpeg') ? 'jpg' : 'png';
      const dest = path.join(ROOT, 'public/assets/flavors', `${j.id}.${ext}`);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, buffer);
      console.log(`[${j.id}] saved ${path.relative(ROOT, dest)}`);
    } catch (e) {
      failed++;
      console.error(`[${j.id}] ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, 7000));
  }
  console.log(`
Done: ${jobs.length - failed} saved, ${failed} failed.`);
  if (failed) process.exitCode = 1;
}

function imageInput(job) {
  return {
    prompt: `${job.prompt} ${STYLE.replace('{BG}', job.bg)}`,
    aspect_ratio: '4:5',
    resolution: '2K',
    output_format: 'png'
  };
}

function heroInput() {
  return { prompt: HERO.prompt, aspect_ratio: '16:9', resolution: '1080p', duration: 5, generate_audio: false };
}

async function run() {
  const plan = [
    ...JOBS.filter((j) => wanted(j.id)).map((j) => ({
      id: j.id,
      model: IMAGE_MODEL,
      input: imageInput(j),
      dest: path.join(ROOT, 'public/assets/flavors', `${j.id}.png`)
    })),
    ...(wanted('hero') ? [{ id: 'hero', model: VIDEO_MODEL, input: heroInput(), dest: path.join(ROOT, 'public/assets/hero.mp4') }] : [])
  ];

  if (dry) {
    for (const p of plan) console.log(`${p.id} -> ${p.model}\n${JSON.stringify(p.input, null, 2)}\n`);
    return;
  }

  const key = loadKey();
  // Submit everything at once so the slow video runs alongside the images.
  const submitted = await Promise.all(
    plan.map(async (p) => {
      try {
        const taskId = await createTask(key, p.model, p.input);
        console.log(`[${p.id}] submitted ${taskId}`);
        return { ...p, taskId };
      } catch (e) {
        console.error(`[${p.id}] submit failed: ${e.message}`);
        return { ...p, error: e.message };
      }
    })
  );

  const results = await Promise.all(
    submitted.map(async (p) => {
      if (p.error) return p;
      try {
        let last = '';
        const urls = await waitForTask(key, p.taskId, {
          onTick: (s) => {
            if (s !== last) console.log(`[${p.id}] ${s}`);
            last = s;
          }
        });
        await download(urls[0], p.dest);
        console.log(`[${p.id}] saved ${path.relative(ROOT, p.dest)}`);
        return { ...p, ok: true };
      } catch (e) {
        console.error(`[${p.id}] ${e.message}`);
        return { ...p, error: e.message };
      }
    })
  );

  const failed = results.filter((r) => !r.ok);
  console.log(`\nDone: ${results.length - failed.length} saved, ${failed.length} failed.`);
  if (failed.length) process.exitCode = 1;
}

(provider === 'gemini' ? runGemini() : run()).catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
