import { Pool } from 'pg'
import { Kysely, PostgresDialect, CamelCasePlugin } from 'kysely'

import { Mission, Reservation, Ticket } from './types'

interface Database {
  missions: Mission,
  reservations: Reservation,
  tickets: Ticket
}

const dialect = new PostgresDialect({
  pool: new Pool({
    connectionString: 'postgresql://postgres.qwigqkmfaubfamsentkz:U7ulwnhWz1v562hP@aws-0-us-east-2.pooler.supabase.com:5432/postgres',
    ssl: { rejectUnauthorized: false }
  })
})

export const db = new Kysely<Database>({
  dialect,
  plugins: [new CamelCasePlugin()]
})

export async function cleanMission(mission: Mission) {
  await deleteReservation(mission.id)
  await deleteTicket(mission.id)
  await deleteMission(mission.id)
}

export async function insertMission(mission: Mission) {
  await db
    .insertInto('missions')
    .values(mission)
    .execute()
}

export async function cleanInsertMission(mission: Mission) {
  await cleanMission(mission)
  await insertMission(mission)
}

export async function deleteMission(id: string) {
  await db
    .deleteFrom('missions')
    .where('id', '=', id)
    .execute()
}

export async function deleteReservation(mission_id: string) {
  await db
    .deleteFrom('reservations')
    .where('missionId', '=', mission_id)
    .execute()
}

export async function deleteTicket(mission_id: string) {
  await db
    .deleteFrom('tickets')
    .where('missionId', '=', mission_id)
    .execute()
}