import { config } from "dotenv";
import { Client } from "pg";
import { schemaFromDatabaseUrl } from "./backup-lib";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL não configurada.");
const schema = schemaFromDatabaseUrl(databaseUrl);
const expected = [
  "Company_organizationId_segment_lifecycle_idx",
  "Lead_organizationId_source_status_idx",
  "Opportunity_organizationId_status_ownerId_idx",
  "Revenue_organizationId_type_status_startsAt_idx",
  "Ticket_organizationId_status_slaDueAt_idx",
  "AutomationRun_organizationId_status_nextAttemptAt_idx",
  "PrivacyRequest_organizationId_status_dueAt_idx",
  "RateLimitBucket_expiresAt_idx",
];
const client = new Client({ connectionString: databaseUrl });
await client.connect();
try {
  const indexes = (await client.query<{ indexname: string }>("SELECT indexname FROM pg_indexes WHERE schemaname = $1", [schema])).rows.map((row) => row.indexname);
  const missing = expected.filter((name) => !indexes.includes(name));
  const relationSize = await client.query<{ total_bytes: string }>("SELECT COALESCE(SUM(pg_total_relation_size(quote_ident(schemaname) || '.' || quote_ident(tablename))), 0)::text AS total_bytes FROM pg_tables WHERE schemaname = $1", [schema]);
  const result = { pass: missing.length === 0, expected: expected.length, present: expected.length - missing.length, missing, totalRelationBytes: relationSize.rows[0]?.total_bytes ?? "0" };
  console.log(JSON.stringify(result));
  if (!result.pass) process.exitCode = 1;
} finally {
  await client.end();
}
