import { defineConfig } from 'drizzle-kit';
import * as path from 'path';

const configDir = path.dirname(__filename);
const repoRoot = path.resolve(configDir, '../../');
const schemaDir = path.join(repoRoot, 'packages', 'db', 'dist', 'schemas', 'index.js');

export default defineConfig({
  dialect: 'postgresql',
  schema: schemaDir,
  out: './src/drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  strict: true,
});
