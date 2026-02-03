import { config } from 'dotenv'
import path from 'node:path'
import { defineConfig } from 'prisma/config'

// Load .env.local for local development
config({ path: '.env.local' })
config({ path: '.env' })

export default defineConfig({
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),
  datasource: {
    url: process.env.DATABASE_URL!,
  },
})
