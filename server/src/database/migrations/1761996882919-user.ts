// Import your schemas here
import type { Connection } from 'mongoose'

export async function up (connection: Connection): Promise<void> {
  await connection.collection('users').updateMany(
    { status: { $exists: false } },
    { $set: { status: true } }
  )
  // Write migration here
}

export async function down (connection: Connection): Promise<void> {
  // Write migration here
  await connection.collection('users').updateMany(
    { status: true },
    { $unset: { status: '' } }
  )
}
