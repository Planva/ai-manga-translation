import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

const url = process.env.DB_URL
if (!url) throw new Error('Missing DB_URL')

const sql = neon(url)
export const db = drizzle(sql, { schema })
export const getDb = () => db
