import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const baseUrl = (process.env.LOAD_BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const requests = Math.max(1, Math.min(10_000, Number(process.env.LOAD_REQUESTS || 250)));
const concurrency = Math.max(1, Math.min(100, Number(process.env.LOAD_CONCURRENCY || 20)));
const pathName = process.env.LOAD_PATH || "/api/health";
const expectedStatus = Number(process.env.LOAD_EXPECT_STATUS || 200);
const latencies: number[] = [];
const errors: string[] = [];
let cursor = 0;

async function worker() {
  while (cursor < requests) {
    const sequence = cursor++;
    const started = performance.now();
    try {
      const response = await fetch(`${baseUrl}${pathName}`, { signal: AbortSignal.timeout(10_000), headers: { "User-Agent": "crm-tupiniquim-load-smoke/1" } });
      await response.arrayBuffer();
      if (response.status !== expectedStatus) errors.push(`#${sequence}: HTTP ${response.status}`);
    } catch (error) {
      errors.push(`#${sequence}: ${error instanceof Error ? error.message : "erro"}`);
    } finally {
      latencies.push(performance.now() - started);
    }
  }
}

const startedAt = Date.now();
await Promise.all(Array.from({ length: concurrency }, () => worker()));
const sorted = latencies.sort((a, b) => a - b);
const percentile = (value: number) => Number((sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * value))] ?? 0).toFixed(2));
const result = {
  baseUrl,
  path: pathName,
  requests,
  concurrency,
  durationMs: Date.now() - startedAt,
  errors: errors.length,
  errorRate: Number((errors.length / requests * 100).toFixed(2)),
  p50Ms: percentile(0.5),
  p95Ms: percentile(0.95),
  p99Ms: percentile(0.99),
  pass: errors.length / requests <= 0.01 && percentile(0.95) <= Number(process.env.LOAD_MAX_P95_MS || 500),
  errorSamples: errors.slice(0, 10),
};
const artifacts = path.resolve(process.cwd(), "artifacts", "load");
await mkdir(artifacts, { recursive: true });
await writeFile(path.join(artifacts, "latest.json"), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result));
if (!result.pass) process.exitCode = 1;
