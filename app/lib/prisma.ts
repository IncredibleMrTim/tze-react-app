import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

// `pg.Pool` defaults to 10 connections when `max` is unset. Prisma Postgres's
// direct connection string authenticates as a role with a small connection
// cap meant for occasional `prisma migrate deploy` runs, not sustained app
// traffic — every warm serverless instance opening its own uncapped pool
// exhausts that cap under real concurrency and takes the whole app down
// with "too many connections for role prisma_migration". Keeping each
// pool small bounds how many connections one instance can hold at once.
function createPrismaClient() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 3,
    idleTimeoutMillis: 10_000,
  })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

// Cached in every environment, not just dev — Fluid Compute reuses a
// function instance across many concurrent requests, so without this a
// fresh pool (and its own connections) could get created per invocation
// instead of one pool being shared for the instance's whole lifetime.
export const prisma = global.prisma || createPrismaClient()
global.prisma = prisma
