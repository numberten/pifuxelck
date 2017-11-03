import * as winston from 'winston';
import { Connection } from 'mysql';
import { Drawing } from './drawing';
import { query } from '../db-promise';

/**
 * A struct that contains all the information of a single step in a pifuxelck
 * game.
 */
export type Turn = {
  player: string
  is_drawing: boolean
  drawing: Drawing
  label: string
}

/**
 * A struct that contains all the information that a user needs in order to take
 * a turn.
 */
export type InboxEntry = {
  game_id: string
  previous_turn: Turn
}

async function rowToInboxEntry(row: any): Promise<InboxEntry> {
  const drawingJson = row['drawing'];
  const entry = {
    game_id: row['game_id'],
    previous_turn: {
      is_drawing: row['is_drawing'],
      label: row['label'],
    },
  } as InboxEntry;

  // Only attempt to unmarshal the drawing if it is a drawing turn.
  // Otherwise the drawing will be an empty string which is not valid JSON.
  if (entry.previous_turn.is_drawing) {
    try {
      entry.previous_turn.drawing = JSON.parse(drawingJson);
    } catch (error) {
      winston.warn(`Unable to unmarshal drawing, ${error}`);
      winston.debug(`Offending drawing: ${drawingJson}`);
      throw error;
    }
  }
  return entry;
}

/** Returns an inbox entry for the given user and game id. */
export async function getInboxEntryByGameId(
    db: Connection,
    userId: string,
    gameId: string): Promise<InboxEntry> {
  winston.info(`Querying for all available inbox entries for ${userId}.`);
  const results = await query(
      db,
      `SELECT
          T.id AS id,
          T.game_id AS game_id,
          T.drawing AS drawing,
          T.label AS label,
          T.is_drawing AS is_drawing
       FROM Turns AS T
       INNER JOIN (
         SELECT MIN(CT.id), CT.game_id, CT.account_id
         FROM Turns AS CT
         WHERE is_complete = 0
         GROUP BY CT.game_id
       ) AS CT ON CT.game_id = T.game_id
       INNER JOIN (
         SELECT MAX(PT.id) as previous_turn_id, PT.game_id
         FROM Turns AS PT
         WHERE is_complete = 1
         GROUP BY PT.game_id
       ) AS PT ON PT.previous_turn_id = T.id
       WHERE CT.account_id = ? AND CT.game_id = ?`,
      [userId, gameId]);
  if (results.length < 1) {
    throw new Error('No entry for that ID.');
  }
  return rowToInboxEntry(results[0]);
}

/*
 * Returns a list of all inbox entries that are currently open for a given
 * player. These inbox entries represent all the turns that the user can
 * currently take.
 */
export async function getInboxEntriesForUser(
    db: Connection,
    userId: string): Promise<InboxEntry[]> {
  winston.info(`Querying for all available inbox entries for ${userId}.`);
  const results = await query(
      db,
      `SELECT
          T.id AS id,
          T.game_id AS game_id,
          T.drawing AS dawing,
          T.label AS label,
          T.is_drawing AS is_drawing
       FROM Turns AS T
       INNER JOIN (
         SELECT MIN(CT.id), CT.game_id, CT.account_id
         FROM Turns AS CT
         WHERE is_complete = 0
         GROUP BY CT.game_id
       ) AS CT ON CT.game_id = T.game_id
       INNER JOIN (
         SELECT MAX(PT.id) as previous_turn_id, PT.game_id
         FROM Turns AS PT
         WHERE is_complete = 1
         GROUP BY PT.game_id
       ) AS PT ON PT.previous_turn_id = T.id
       WHERE CT.account_id = ?`,
      [userId]);
  const entries = [];
  for (let i = 0; i < results.length; i++) {
    entries.push(await rowToInboxEntry(results[i]));
  }
  return entries;
}

/**
 * Updates the users turn in a given game with a label. This will fail if the
 * user is not the next player, or if the next turn is not a label turn.
 */
export async function updateDrawingTurn(
    db: Connection,
    userId: string,
    gameId: string,
    drawing: Drawing): Promise<void> {
  winston.info(`User ${userId} updating drawing in game ${gameId}.`);
  const drawingJson = JSON.stringify(drawing);

  const results = await query(
      db,
      `UPDATE Turns, Games
       SET
          drawing = ?,
          is_complete = 1,
          Games.next_expiration = NOW() + INTERVAL 2 DAY
       WHERE Turns.game_id = Games.id
         AND Turns.account_id = ?
         AND Turns.game_id = ?
         AND Turns.is_drawing = 1
         AND Turns.id = (
              SELECT MIN(T.id)
              FROM (SELECT * FROM Turns) AS T
              WHERE T.is_complete = 0 AND T.game_id = ?)`,
      [drawingJson, userId, gameId, gameId]);

  const affectedRows = results.affectedRows;
  if (affectedRows <= 0) {
    winston.info('Drawing turn update failed because no rows were affected.');
    throw new Error('Unable to take a turn at this time.');
  }
}

/**
 * Updates the users turn in a given game with a drawing. This will fail if the
 * user is not the next player, or if the next turn is not a drawing turn.
 */
export async function updateLabelTurn(
    db: Connection,
    userId: string,
    gameId: string,
    label: string): Promise<void> {
  winston.info(`User ${userId} updating drawing in game ${gameId}.`);
  const results = await query(
      db,
      `UPDATE Turns, Games
       SET
          Turns.label = ?,
          Turns.is_complete = 1,
          Games.next_expiration = NOW() + INTERVAL 2 DAY
       WHERE Turns.game_id = Games.id
         AND Turns.account_id = ?
         AND Turns.game_id = ?
         AND Turns.is_drawing = 0
         AND Turns.id = (
              SELECT MIN(T.id)
              FROM (SELECT * FROM Turns) AS T
              WHERE T.is_complete = 0 AND T.game_id = ?)`,
      [label, userId, gameId, gameId])

  const affectedRows = results.affectedRows;
  if (affectedRows <= 0) {
    winston.info('Label turn update failed because no rows were affected.');
    throw new Error('Unable to take a turn at this time.');
  }
}
