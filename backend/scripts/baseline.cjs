const { PrismaClient } = require('@prisma/client');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const prisma = new PrismaClient();
function command(args) {
  // Credentials stay in DATABASE_URL, never in arguments or a generated file.
  const cli = path.join(__dirname, '../node_modules/prisma/build/index.js');
  const result = spawnSync(process.execPath, [cli, ...args], { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  if (result.status !== 0) throw new Error('Schema verification failed. Stop and inspect the migration history; do not reset the database.');
}
async function main() {
  const table = await prisma.$queryRaw`SELECT to_regclass('public._prisma_migrations')::text AS name`;
  if (table[0].name) {
    const history = await prisma.$queryRaw`SELECT migration_name FROM "_prisma_migrations" WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL`;
    if (history.some((row) => row.migration_name === '20261022000000_baseline')) {
      console.log('Baseline already recorded. Run npm run db:deploy.'); return;
    }
    if (history.length) throw new Error('Existing migration history requires manual reconciliation. No baseline was changed.');
  }
  const tables = await prisma.$queryRaw`SELECT count(*)::int AS count FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' AND table_name <> '_prisma_migrations'`;
  if (!tables[0].count) { console.log('Empty database: run npm run db:deploy directly.'); return; }
  await prisma.$disconnect();
  command(['migrate', 'diff', '--from-schema-datasource', 'prisma/baseline.prisma', '--to-schema-datamodel', 'prisma/baseline.prisma', '--exit-code']);
  command(['migrate', 'resolve', '--applied', '20261022000000_baseline']);
  console.log('Verified existing schema and recorded baseline. Run npm run db:deploy.');
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
