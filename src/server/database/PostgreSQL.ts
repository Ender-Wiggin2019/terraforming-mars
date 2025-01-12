import type * as pg from 'pg';
import {IDatabase, IGameShortData} from './IDatabase';
import {IGame, Score} from '../IGame';
import {GameOptions} from '../game/GameOptions';
import {GameId, ParticipantId, PlayerId, isGameId, safeCast} from '../../common/Types';
import {SerializedGame} from '../SerializedGame';
import {User} from '../User';
import {Timer} from '../../common/Timer';
import {daysAgoToSeconds, stringToNumber} from './utils';
import {GameIdLedger} from './IDatabase';
import {UserRank} from '../../common/rank/RankManager';
import {Color} from '../../common/Color';
type StoredSerializedGame = Omit<SerializedGame, 'gameOptions' | 'gameLog'> & {logLength: number};
// import {Rating} from 'ts-trueskill';

export const POSTGRESQL_TABLES = ['game', 'games', 'game_results', 'participants', 'completed_game'] as const;

const POSTGRES_TRIM_COUNT = stringToNumber(process.env.POSTGRES_TRIM_COUNT, 0);

export class PostgreSQL implements IDatabase {
  private databaseName: string | undefined = undefined; // Use this only for stats.
  protected trimCount = POSTGRES_TRIM_COUNT;

  protected statistics = {
    saveCount: 0,
    saveErrorCount: 0,
    saveConflictUndoCount: 0,
    saveConflictNormalCount: 0,
  };
  private _client: pg.Pool | undefined;

  protected get client(): pg.Pool {
    if (this._client === undefined) {
      throw new Error('attempt to get client before intialized');
    }
    return this._client;
  }

  constructor(
    private config: pg.ClientConfig = {
      connectionString: process.env.POSTGRES_HOST,
    }) {
    if (config.connectionString?.startsWith('postgres')) {
      config.ssl = false;
    }

    if (config.database) {
      this.databaseName = config.database;
    } else if (config.connectionString) {
      try {
        // Remove leading / from pathname.
        this.databaseName = new URL(config.connectionString).pathname.replace(/^\//, '');
      } catch (e) {
        console.warn(e);
      }
    }
  }

  public async initialize(): Promise<void> {
    const {Pool} = await import('pg');
    this._client = new Pool(this.config);

    //  createtime timestamp 时间戳带毫秒  createtime timestamp(0) 去掉毫秒
    const sql = `
    CREATE TABLE IF NOT EXISTS games(
      game_id varchar,
      save_id integer,
      game text,
      status text default 'running',
      createtime timestamp(0) default now(),
      prop text, 
      PRIMARY KEY (game_id, save_id));

    /* A single game, storing the log and the options. Normalizing out some of the game state. */
    CREATE TABLE IF NOT EXISTS game(
      game_id varchar NOT NULL,
      log text NOT NULL,
      options text NOT NULL,
      status text default 'running' NOT NULL,
      created_time timestamp default now() NOT NULL,
      PRIMARY KEY (game_id));

    /* A list of the players and spectator IDs, which optimizes loading unloaded for a specific player. */
    CREATE TABLE IF NOT EXISTS participants(
      game_id varchar,
      participants varchar[],
      PRIMARY KEY (game_id));

    CREATE TABLE IF NOT EXISTS game_results(
      game_id varchar not null,
      seed_game_id varchar,
      players integer,
      generations integer,
      game_options text,
      scores text,
      createtime timestamp(0) default now(),
      PRIMARY KEY (game_id));

    CREATE TABLE IF NOT EXISTS completed_game(
      game_id varchar not null,
      completed_time timestamp default now(),
      PRIMARY KEY (game_id));

    CREATE INDEX IF NOT EXISTS games_i1 on games(save_id);
    CREATE INDEX IF NOT EXISTS games_i2 on games(createtime);
    CREATE INDEX IF NOT EXISTS participants_idx_ids on participants USING GIN (participants);
    CREATE INDEX IF NOT EXISTS completed_game_idx_completed_time on completed_game(completed_time);
    `;
    await this.client.query(sql);
    await this.client.query('CREATE TABLE IF NOT EXISTS users(id varchar not null, name varchar not null, password varchar not null, prop varchar, createtime timestamp(0) default now(), PRIMARY KEY (id))');

    // 天梯 新增`user_rank`表记录用户的排名
    await this.client.query('CREATE TABLE IF NOT EXISTS user_rank (id varchar not null, rank_value integer default 0, mu float4, sigma float4,trueskill float4, PRIMARY KEY (id))');
    // 天梯 玩家数据表，用于保存段位的历史记录，和未来的数据分析 TODO: 未来如果做分析的话加上index
    await this.client.query('CREATE TABLE IF NOT EXISTS user_game_results (user_id varchar not null, game_id varchar not null, players integer, generations integer, createtime timestamp(0) default now(), corporation text, position integer, player_score integer, rank_value integer, mu float4, sigma float4,trueskill float4, is_rank integer, phase text, PRIMARY KEY (user_id, game_id))');
  }

  public async getPlayerCount(gameId: GameId): Promise<number> {
    const sql = 'SELECT players FROM games WHERE save_id = 0 AND game_id = $1 LIMIT 1';

    const res = await this.client.query(sql, [gameId]);
    if (res.rows.length === 0) {
      throw new Error(`no rows found for game id ${gameId}`);
    }
    return res.rows[0].players;
  }

  public async getGames(): Promise<Array<IGameShortData>> {
    const sql: string = 'SELECT games.game_id,games.prop FROM games, (SELECT max(save_id) save_id, game_id FROM games  GROUP BY game_id) a WHERE games.game_id = a.game_id AND games.save_id = a.save_id ORDER BY createtime DESC';
    const res = await this.client.query(sql);
    return res.rows.map((row) => ({gameId: row.game_id, shortData: row.prop !== undefined && row.prop !=='' ? row.prop : undefined}));
  }

  private compose(game: string, log: string, options: string): SerializedGame {
    const stored: StoredSerializedGame = JSON.parse(game);
    const {logLength, ...remainder} = stored;
    // console.log(log, options, stored.logLength);
    // TODO(kberg): Remove the outer join, and the else of this conditional by 2025-01-01
    if (stored.logLength !== undefined) {
      const gameLog = JSON.parse(log);
      gameLog.length = logLength; // 截断日志, 感觉没啥必要
      const gameOptions = JSON.parse(options);
      return {...remainder, gameOptions, gameLog};
    } else {
      return remainder as SerializedGame;
    }
  }

  public async getGameId(participantId: ParticipantId): Promise<GameId> {
    try {
      const res = await this.client.query('select game_id from participants where $1 = ANY(participants)', [participantId]);
      if (res.rowCount === 0) {
        throw new Error(`Game for player id ${participantId} not found`);
      }
      return res.rows[0].game_id;
    } catch (err) {
      console.error('PostgreSQL:getGameId', err);
      throw err;
    }
  }

  public async getSaveIds(gameId: GameId): Promise<Array<number>> {
    const res = await this.client.query('SELECT distinct save_id FROM games WHERE game_id = $1', [gameId]);
    const allSaveIds: Array<number> = [];
    res.rows.forEach((row) => {
      allSaveIds.push(row.save_id);
    });
    return Promise.resolve(allSaveIds);
  }

  public async getGame(gameId: GameId): Promise<SerializedGame> {
    // Retrieve last save from database
    const res = await this.client.query(
      `SELECT
        games.game as game,
        game.log as log,
        game.options as options
      FROM games
      LEFT JOIN game on game.game_id = games.game_id
      WHERE games.game_id = $1
      ORDER BY save_id DESC LIMIT 1`,
      [gameId],
    );
    if (res.rows.length === 0 || res.rows[0] === undefined) {
      throw new Error(`Game ${gameId} not found`);
    }
    const row = res.rows[0];
    return this.compose(row.game, row.log, row.options);
  }

  async getGameVersion(gameId: GameId, saveId: number): Promise<SerializedGame> {
    const res = await this.client.query(
      `SELECT
        games.game as game,
        game.log as log,
        game.options as options
      FROM games
      LEFT JOIN game on game.game_id = games.game_id
      WHERE games.game_id = $1
      AND games.save_id = $2`,
      [gameId, saveId],
    );

    if (res.rowCount === 0) {
      throw new Error(`Game ${gameId} not found at save_id ${saveId}`);
    }
    const row = res.rows[0];
    return this.compose(row.game, row.log, row.options);
  }

  saveGameResults(gameId: GameId, players: number, generations: number, gameOptions: GameOptions, scores: Array<Score>): void {
    this.client.query('INSERT INTO game_results (game_id, seed_game_id, players, generations, game_options, scores) VALUES($1, $2, $3, $4, $5, $6)', [gameId, gameOptions.clonedGamedId, players, generations, JSON.stringify(gameOptions), JSON.stringify(scores)], (err) => {
      if (err) {
        console.error('PostgreSQL:saveGameResults', err);
        throw err;
      }
    });
  }

  async getMaxSaveId(gameId: GameId): Promise<number> {
    const res = await this.client.query('SELECT MAX(save_id) as save_id FROM games WHERE game_id = $1', [gameId]);
    return res.rows[0].save_id;
  }

  throwIf(err: any, condition: string) {
    if (err) {
      console.error('PostgreSQL', condition, err);
      throw err;
    }
  }

  async cleanGame(gameId: GameId): Promise<void> {
    const maxSaveId = await this.getMaxSaveId(gameId);
    console.log(`maxSaveId: ${maxSaveId}, game_id:${gameId}  `);
    // DELETE all saves except initial and last one
    await this.client.query('DELETE FROM games WHERE game_id = $1 AND save_id < $2 AND save_id > 0', [gameId, maxSaveId]);
    // Flag game as finished
    await this.client.query('UPDATE games SET status = \'finished\' WHERE game_id = $1', [gameId]);
    // Purge after setting the status as finished so it does not delete the game.
    // const delete3 = this.purgeUnfinishedGames();
    // await Promise.all([delete1, delete2]);
  }
  async markFinished(gameId: GameId): Promise<void> {
    const promise1 = this.client.query('UPDATE games SET status = \'finished\' WHERE game_id = $1', [gameId]);
    const promise2 = this.client.query('INSERT INTO completed_game(game_id) VALUES ($1)', [gameId]);
    await Promise.all([promise1, promise2]);
  }

  // Purge unfinished games older than MAX_GAME_DAYS days. If this environment variable is absent, it uses the default of 10 days.
  async purgeUnfinishedGames(maxGameDays: string | undefined = process.env.MAX_GAME_DAYS): Promise<Array<GameId>> {
    const dateToSeconds = daysAgoToSeconds(maxGameDays, 10);
    const selectResult = await this.client.query('SELECT DISTINCT game_id FROM games WHERE created_time < to_timestamp($1)', [dateToSeconds]);
    let gameIds = selectResult.rows.map((row) => row.game_id);
    if (gameIds.length > 1000) {
      console.log('Truncated purge to 1000 games.');
      gameIds = gameIds.slice(0, 1000);
    } else {
      console.log(`${gameIds.length} games to be purged.`);
    }

    if (gameIds.length > 0) {
      // https://github.com/brianc/node-postgres/wiki/FAQ#11-how-do-i-build-a-where-foo-in--query-to-find-rows-matching-an-array-of-values
      const deleteGamesResult = await this.client.query('DELETE FROM games WHERE game_id = ANY($1)', [gameIds]);
      console.log(`Purged ${deleteGamesResult.rowCount} rows from games`);
    }
    return gameIds;
  }

  cleanGameAllSaves(game_id: string): void {
    // DELETE all saves
    this.client.query('DELETE FROM games WHERE game_id = $1 ', [game_id], function(err: { message: any; }) {
      if (err) {
        return console.warn('cleanGame '+game_id, err);
      }
    });
  }

  async cleanGameSave(game_id: string, save_id: number): Promise<void> {
    // DELETE one  save  by save id
    await this.client.query('DELETE FROM games WHERE game_id = $1 AND save_id = $2', [game_id, save_id], function(err: { message: any; }) {
      if (err) {
        return console.warn('cleanGameSave '+game_id, err);
      }
    });
  }
  async restoreGame(gameId: GameId, save_id: number, game: IGame, playId: string): Promise<void> {
    const serializedGame = await this.getGameVersion(gameId, save_id);
    if ( serializedGame === undefined) {
      console.error(`PostgreSQL:restoreGame Game not found ${gameId}`);
      return Promise.resolve();
    }
    if (serializedGame.lastSaveId !== save_id) {
      console.error(`PostgreSQL:restoreGame saveId not equal ${gameId} ${save_id} ${serializedGame.lastSaveId} `);
    }


    // Rebuild each objects
    const gamelog = game.gameLog;
    game.loadFromJSON(serializedGame, true);
    game.gameLog = gamelog;
    // 这里undoCount取得是数据库中的值+1，对于连续的 一动-撤回-一动-撤回， 只会计算一次，但是没啥影响
    game.undoCount ++;
    // 会员回退时 以当前时间开始计时， 避免计时算到上一个人头上
    if (playId === 'manager') {
      game.log('${0} undo turn', (b) => b.playerColor(playId as Color));
      Timer.newInstance().stop();
      game.activePlayer.timer.start();
    } else {
      game.log('${0} undo turn', (b) => b.player(game.getPlayerById(playId as PlayerId)));
    }
    console.log(`${playId} undo turn ${gameId}  ${save_id}`);
    return Promise.resolve();
  }


  async compressCompletedGames(compressCompletedGamesDays: string | undefined = process.env.COMPRESS_COMPLETED_GAMES_DAYS): Promise<void> {
    if (compressCompletedGamesDays === undefined) {
      return;
    }
    const dateToSeconds = daysAgoToSeconds(compressCompletedGamesDays, 0);
    const selectResult = await this.client.query('SELECT DISTINCT game_id FROM completed_game WHERE completed_time < to_timestamp($1)', [dateToSeconds]);
    const gameIds = selectResult.rows.slice(0, 1000).map((row) => row.game_id);
    console.log(`${gameIds.length} completed games to be compressed.`);
    if (gameIds.length > 1000) {
      gameIds.length = 1000;
      console.log('Compressing 1000 games.');
    }
    for (const gameId of gameIds) {
      // This isn't using await because nothing really depends on it.
      this.compressCompletedGame(gameId);
    }
  }

  async compressCompletedGame(gameId: GameId): Promise<pg.QueryResult<any>> {
    const maxSaveId = await this.getMaxSaveId(gameId);
    return this.client.query('DELETE FROM games WHERE game_id = $1 AND save_id < $2 AND save_id > 0', [gameId, maxSaveId])
      .then(() => {
        return this.client.query('DELETE FROM completed_game where game_id = $1', [gameId]);
      });
  }

  async saveGame(game: IGame): Promise<void> {
    try {
      const serialized = game.serialize();
      const options = JSON.stringify(serialized.gameOptions);
      const log = JSON.stringify(serialized.gameLog);

      const storedSerialized: StoredSerializedGame = {...serialized, logLength: game.gameLog.length};
      (storedSerialized as any).gameLog = [];
      (storedSerialized as any).gameOptions = {};
      const gameJSON = JSON.stringify(storedSerialized);
      const prop = game.toShortJSON();
      this.statistics.saveCount++;
      await this.client.query('BEGIN');

      // Holding onto a value avoids certain race conditions where saveGame is called twice in a row.
      // const thisSaveId = game.lastSaveId;
      // xmax = 0 is described at https://stackoverflow.com/questions/39058213/postgresql-upsert-differentiate-inserted-and-updated-rows-using-system-columns-x
      const res = await this.client.query(
        `INSERT INTO games (game_id, save_id, game, prop)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (game_id, save_id) DO UPDATE SET game = $3
        RETURNING (xmax = 0) AS inserted`,
        [game.id, game.lastSaveId, gameJSON, prop]);

      await this.client.query(
        `INSERT INTO game (game_id, log, options)
        VALUES ($1, $2, $3)
        ON CONFLICT (game_id)
        DO UPDATE SET log = $2`,
        [game.id, log, options]);


      let inserted = true;
      try {
        inserted = res.rows[0].inserted;
      } catch (err) {
        console.error(err);
      }
      if (inserted === false) {
        if (game.gameOptions.undoOption) {
          this.statistics.saveConflictUndoCount++;
        } else {
          this.statistics.saveConflictNormalCount++;
        }
      }
      // Save IDs on the very first save for this game. That's when the incoming saveId is 0, and also
      // when the database operation was an insert. (We should figure out why multiple saves occur and
      // try to stop them. But that's for another day.)
      // if (inserted === true && thisSaveId === 0) {
      //   const participantIds: Array<ParticipantId> = game.getPlayers().map((p) => p.id);
      //   if (game.spectatorId) participantIds.push(game.spectatorId);
      //   await this.storeParticipants({gameId: game.id, participantIds: participantIds});
      // }

      await this.client.query('COMMIT');
    } catch (err) {
      await this.client.query('ROLLBACK');
      this.statistics.saveErrorCount++;
      console.error('PostgreSQL:saveGame' + game.id, err);
    }
    this.trim(game);
  }

  private async trim(game: IGame) {
    if (this.trimCount <= 0) {
      return;
    }
    if (game.lastSaveId % this.trimCount === 0) {
      const maxSaveId = game.lastSaveId - this.trimCount;
      await this.client.query(
        'DELETE FROM games WHERE game_id = $1 AND save_id > 0 AND save_id < $2', [game.id, maxSaveId]);
    }
    return Promise.resolve();
  }

  async deleteGameNbrSaves(gameId: GameId, rollbackCount: number): Promise<void> {
    if (rollbackCount <= 0) {
      console.error(`invalid rollback count for ${gameId}: ${rollbackCount}`);
      // Should this be an error?
      return;
    }
    await this.client.query('DELETE FROM games WHERE ctid IN (SELECT ctid FROM games WHERE game_id = $1 ORDER BY save_id DESC LIMIT $2)', [gameId, rollbackCount]);
  }

  public async storeParticipants(entry: GameIdLedger): Promise<void> {
    await this.client.query('INSERT INTO participants (game_id, participants) VALUES($1, $2)', [entry.gameId, entry.participantIds]);
  }

  public async getParticipants(): Promise<Array<{gameId: GameId, participantIds: Array<ParticipantId>}>> {
    const res = await this.client.query('select game_id, participants from participants');
    return res.rows.map((row) => {
      return {gameId: safeCast(row.game_id, isGameId), participantIds: row.participants as Array<ParticipantId>};
    });
  }
  saveUser(id: string, name: string, password: string, prop: string): void {
    // Insert user
    this.client.query('INSERT INTO users(id, name, password, prop) VALUES($1, $2, $3, $4)', [id, name, password, prop], function(err:any ) {
      if (err) {
        return console.error('saveUser' + id, err);
      }
    });
  }
  getUsers(cb: (err: any, allUsers: Array<User>) => void): void {
    const allUsers:Array<User> = [];
    const sql: string = 'SELECT distinct id, name, password, prop, createtime FROM users ';
    this.client.query(sql, [], (err, res) => {
      if (err) {
        return console.warn('getUsers', err);
      }
      if (res && res.rows.length > 0) {
        res.rows.forEach((row) => {
          const user = Object.assign(new User('', '', ''), {id: row.id, name: row.name, password: row.password, createtime: row.createtime}, row.prop );
          if (user.donateNum === 0 && user.isvip() > 0) {
            user.donateNum = 1;
          }
          allUsers.push(user );
        });
        return cb(err, allUsers);
      }
    });
  }

  public async stats(): Promise<{[key: string]: string | number}> {
    const map: {[key: string]: string | number}= {
      'type': 'POSTGRESQL',
      'pool-total-count': this.client.totalCount,
      'pool-idle-count': this.client.idleCount,
      'pool-waiting-count': this.client.waitingCount,
      'save-count': this.statistics.saveCount,
      'save-error-count': this.statistics.saveErrorCount,
      'save-conflict-normal-count': this.statistics.saveConflictNormalCount,
      'save-conflict-undo-count': this.statistics.saveConflictUndoCount,
    };

    const columns = POSTGRESQL_TABLES.map((table_name) => `pg_size_pretty(pg_total_relation_size('${table_name}')) as ${table_name}_size`);
    const dbsizes = await this.client.query(`SELECT ${columns.join(', ')}, pg_size_pretty(pg_database_size('${this.databaseName}')) as db_size`);

    function varz(x: string) {
      return x.replaceAll('_', '-');
    }

    POSTGRESQL_TABLES.forEach((table) => map['size-bytes-' + varz(table)] = dbsizes.rows[0][table + '_size']);
    map['size-bytes-database'] = dbsizes.rows[0].db_size;

    // Using count(*) is inefficient, but the estimates from here
    // https://stackoverflow.com/questions/7943233/fast-way-to-discover-the-row-count-of-a-table-in-postgresql
    // seem wildly inaccurate.
    //
    // heroku pg:bloat --app terraforming-mars
    // shows some bloat
    // and the postgres command
    // VACUUM (VERBOSE) shows a fairly reasonable vacumm (no rows locked, for instance),
    // so it's not clear why those wrong. But these select count(*) commands seem pretty quick
    // in testing. :fingers-crossed:
    for (const table of POSTGRESQL_TABLES) {
      const result = await this.client.query('select count(*) as rowcount from ' + table);
      map['rows-' + varz(table)] = result.rows[0].rowcount;
    }
    return map;
  }

  refresh(): void {

  }

  addUserRank(userRank: UserRank): void {
    // Insert user
    this.client.query('INSERT INTO user_rank(id, rank_value, mu, sigma, trueskill) VALUES($1, $2, $3, $4, $5)', [userRank.userId, userRank.rankValue, userRank.mu, userRank.sigma, userRank.trueskill], function(err: { message: any; }) {
      if (err) {
        return console.error('addUserRank', err);
      }
    });
  }

  public async getUserRanks(limit:number | undefined = 0): Promise<Array<UserRank>> {
    const concatLimit: string = limit === 0 ? '' : ' limit ' + limit.toString();
    const sql: string = ' SELECT id, rank_value, mu, sigma, trueskill FROM user_rank   order by rank_value desc,trueskill desc  ' + concatLimit;
    const allUserRanks : Array<UserRank> = [];
    const res = await this.client.query(sql);
    res.rows.forEach((row) => {
      const userRank = new UserRank(row.id, row.rank_value, row.mu, row.sigma, row.trueskill);
      allUserRanks.push(userRank);
    });
    return allUserRanks;
  }

  public async updateUserRank(userRank:UserRank): Promise<void> {
    await this.client.query('UPDATE user_rank SET rank_value = $1, mu = $2, sigma = $3 , trueskill = $4 WHERE id = $5', [userRank.rankValue, userRank.mu, userRank.sigma, userRank.trueskill, userRank.userId]);
  }

  // @param position: 这局游戏第几名
  saveUserGameResult(user_id: string, game_id: string, phase: string, score: Score, players: number, generations: number, create_time: string, position: number, is_rank: boolean, user_rank: UserRank | undefined): void {
    const sql: string = user_rank !== undefined ?
      'INSERT INTO user_game_results (user_id, game_id, players, generations, createtime, corporation, position, player_score, rank_value, mu, sigma,trueskill, is_rank, phase) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)' :
      'INSERT INTO user_game_results (user_id, game_id, players, generations, createtime, corporation, position, player_score, is_rank, phase) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)';
    const params: any = user_rank !== undefined ?
      [user_id, game_id, players, generations, create_time, score.corporation, position, score.playerScore, user_rank.rankValue, user_rank.mu, user_rank.sigma, user_rank.trueskill, is_rank?1:0, phase] :
      [user_id, game_id, players, generations, create_time, score.corporation, position, score.playerScore, is_rank?1:0, phase];

    this.client.query(sql, params, (err) => {
      if (err) {
        console.error('saveUserGameResult', err);
        throw err;
      }
    });
  }
}
