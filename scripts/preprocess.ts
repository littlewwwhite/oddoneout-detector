/**
 * Preprocess script: batch analyze images in data/ folder and generate result images
 * Run with: npx tsx scripts/preprocess.ts
 */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import crypto from 'crypto';

interface DetectionResult {
  found: boolean;
  gridSize: { rows: number; cols: number };
  anomalyPosition?: { row: number; col: number };
  boundingBox?: { ymin: number; xmin: number; ymax: number; xmax: number };
  description: string;
  reason: string;
  confidence: number;
}

interface CacheEntry {
  hash: string;
  filename: string;
  result: DetectionResult;
  resultImagePath: string;
}

interface CacheIndex {
  version: string;
  entries: Record<string, CacheEntry>;
}

const API_KEY = process.env.API_KEY || 'sk-uwqszkgjjbjtgyblqddvdolgenrlojxjvutvrjhwsjgkdqaz';
const DATA_DIR = path.join(process.cwd(), 'data');
const CACHE_DIR = path.join(process.cwd(), 'public', 'cache');
const INDEX_FILE = path.join(CACHE_DIR, 'index.json');

async function computeImageHash(buffer: Buffer): Promise<string> {
  // Use SHA-256 and take first 32 chars to match browser-side hashing
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');
  return hash.slice(0, 32);
}

async function callDetectionAPI(base64Image: string, retries = 3): Promise<DetectionResult> {
  const prompt = `找出网格中的异类(颜色/破损/形状不同)。返回JSON:{"found":bool,"gridSize":{"rows":n,"cols":n},"anomalyPosition":{"row":n,"col":n},"boundingBox":{"ymin":0-1000,"xmin":0-1000,"ymax":0-1000,"xmax":0-1000},"reason":"简短原因","description":"简短描述","confidence":0-1}`;

  const response = await fetch("https://api.siliconflow.cn/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "zai-org/GLM-4.5V",
      messages: [{
        role: "user",
        content: [
          { type: "text", text: prompt + "\n\nIMPORTANT: You must respond with a valid JSON object only, no additional text or explanation." },
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
        ]
      }],
      temperature: 0.2,
      max_tokens: 1024,
      stream: false
    })
  });

  if (!response.ok) {
    if (response.status === 429 && retries > 0) {
      console.log(`   ⏳ Rate limited, waiting 10s before retry (${retries} left)...`);
      await new Promise(r => setTimeout(r, 10000));
      return callDetectionAPI(base64Image, retries - 1);
    }
    throw new Error(`API error: ${response.status}`);
  }

  const result = await response.json();
  const content = result.choices[0].message.content;

  let data: DetectionResult;
  try {
    data = JSON.parse(content);
  } catch {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      data = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error("No JSON found in response");
    }
  }

  // Set defaults
  data.found = data.found ?? false;
  data.gridSize = data.gridSize ?? { rows: 4, cols: 4 };
  data.description = data.description ?? (data.found ? "Anomaly detected" : "No anomaly");
  data.reason = data.reason ?? "";
  data.confidence = data.confidence ?? 0.8;
  data.anomalyPosition = data.anomalyPosition ?? { row: 0, col: 0 };
  data.boundingBox = data.boundingBox ?? { ymin: 0, xmin: 0, ymax: 0, xmax: 0 };

  if (!data.found) {
    data.boundingBox = { ymin: 0, xmin: 0, ymax: 0, xmax: 0 };
  }

  return data;
}

async function generateResultImage(
  inputPath: string,
  outputPath: string,
  result: DetectionResult
): Promise<void> {
  const image = sharp(inputPath);
  const metadata = await image.metadata();
  const width = metadata.width!;
  const height = metadata.height!;

  if (!result.found || !result.boundingBox) {
    // No anomaly - add green border
    const svgOverlay = `
      <svg width="${width}" height="${height}">
        <rect x="4" y="4" width="${width - 8}" height="${height - 8}"
              fill="none" stroke="#22c55e" stroke-width="8" rx="8"/>
        <rect x="20" y="20" width="120" height="36" fill="#22c55e" rx="6"/>
        <text x="80" y="45" font-family="Arial" font-size="18" font-weight="bold"
              fill="white" text-anchor="middle">PERFECT</text>
      </svg>`;

    await image
      .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }])
      .jpeg({ quality: 90 })
      .toFile(outputPath);
    return;
  }

  // Has anomaly - draw bounding box
  const box = result.boundingBox;
  const padding = 0.1;
  const xmin = Math.max(0, (box.xmin / 1000 - padding * (box.xmax - box.xmin) / 1000)) * width;
  const ymin = Math.max(0, (box.ymin / 1000 - padding * (box.ymax - box.ymin) / 1000)) * height;
  const xmax = Math.min(1, (box.xmax / 1000 + padding * (box.xmax - box.xmin) / 1000)) * width;
  const ymax = Math.min(1, (box.ymax / 1000 + padding * (box.ymax - box.ymin) / 1000)) * height;

  const boxWidth = xmax - xmin;
  const boxHeight = ymax - ymin;
  const confidence = Math.round(result.confidence * 100);

  const svgOverlay = `
    <svg width="${width}" height="${height}">
      <!-- Darkened overlay outside the box -->
      <defs>
        <mask id="boxMask">
          <rect width="${width}" height="${height}" fill="white"/>
          <rect x="${xmin}" y="${ymin}" width="${boxWidth}" height="${boxHeight}" fill="black" rx="8"/>
        </mask>
      </defs>
      <rect width="${width}" height="${height}" fill="rgba(0,0,0,0.4)" mask="url(#boxMask)"/>

      <!-- Red bounding box -->
      <rect x="${xmin}" y="${ymin}" width="${boxWidth}" height="${boxHeight}"
            fill="none" stroke="#ef4444" stroke-width="4" rx="8"/>

      <!-- Confidence label -->
      <rect x="${xmin}" y="${Math.max(0, ymin - 32)}" width="100" height="28" fill="#dc2626" rx="4"/>
      <text x="${xmin + 50}" y="${Math.max(18, ymin - 10)}"
            font-family="Arial" font-size="14" font-weight="bold"
            fill="white" text-anchor="middle">${confidence}% 置信度</text>
    </svg>`;

  await image
    .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }])
    .jpeg({ quality: 90 })
    .toFile(outputPath);
}

async function main() {
  console.log('🚀 Starting preprocessing...');

  // Ensure cache directory exists
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }

  // Load existing index
  let index: CacheIndex = { version: '1.0', entries: {} };
  if (fs.existsSync(INDEX_FILE)) {
    index = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf-8'));
    console.log(`📂 Loaded existing index with ${Object.keys(index.entries).length} entries`);
  }

  // Get all images in data folder
  const files = fs.readdirSync(DATA_DIR).filter(f =>
    /\.(jpg|jpeg|png|webp)$/i.test(f)
  );
  console.log(`📷 Found ${files.length} images in data/`);

  let processed = 0;
  let skipped = 0;
  let errors = 0;

  for (const filename of files) {
    const inputPath = path.join(DATA_DIR, filename);
    const buffer = fs.readFileSync(inputPath);
    const hash = await computeImageHash(buffer);

    // Skip if already processed
    if (index.entries[hash]) {
      console.log(`⏭️  Skipping ${filename} (already cached)`);
      skipped++;
      continue;
    }

    console.log(`🔍 Processing ${filename}...`);

    try {
      const base64 = buffer.toString('base64');
      const result = await callDetectionAPI(base64);

      const resultFilename = `result_${hash}.jpg`;
      const resultPath = path.join(CACHE_DIR, resultFilename);

      await generateResultImage(inputPath, resultPath, result);

      index.entries[hash] = {
        hash,
        filename,
        result,
        resultImagePath: `/cache/${resultFilename}`
      };

      // Save index after each successful processing
      fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2));

      console.log(`✅ ${filename}: ${result.found ? `Found at [${result.anomalyPosition?.row},${result.anomalyPosition?.col}]` : 'Perfect'}`);
      processed++;

      // Rate limiting - wait 5s between requests to avoid 429
      await new Promise(r => setTimeout(r, 5000));

    } catch (err) {
      console.error(`❌ Error processing ${filename}:`, err);
      errors++;
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   Processed: ${processed}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Errors: ${errors}`);
  console.log(`   Total cached: ${Object.keys(index.entries).length}`);
}

main().catch(console.error);
