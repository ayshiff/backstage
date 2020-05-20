/*
 * Copyright 2020 Spotify AB
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import Knex from 'knex';
import path from 'path';
import { Database, DbEntityRequest, DbEntityResponse } from './Database';
import { AddDatabaseLocation, DatabaseLocation } from './types';
import { ConflictError } from '@backstage/backend-common';

describe('Database', () => {
  let database: Knex;
  let entityRequest: DbEntityRequest;
  let entityResponse: DbEntityResponse;

  beforeEach(async () => {
    database = Knex({
      client: 'sqlite3',
      connection: ':memory:',
      useNullAsDefault: true,
    });

    await database.raw('PRAGMA foreign_keys = ON');
    await database.migrate.latest({
      directory: path.resolve(__dirname, 'migrations'),
      loadExtensions: ['.ts'],
    });

    entityRequest = {
      entity: {
        apiVersion: 'a',
        kind: 'b',
        metadata: {
          name: 'c',
          namespace: 'd',
          labels: { e: 'f' },
          annotations: { g: 'h' },
        },
        spec: { i: 'j' },
      },
    };

    entityResponse = {
      locationId: undefined,
      entity: {
        apiVersion: 'a',
        kind: 'b',
        metadata: {
          uid: expect.anything(),
          generation: expect.anything(),
          name: 'c',
          namespace: 'd',
          labels: { e: 'f' },
          annotations: { g: 'h' },
        },
        spec: { i: 'j' },
      },
    };
  });

  it('manages locations', async () => {
    const db = new Database(database);
    const input: AddDatabaseLocation = { type: 'a', target: 'b' };
    const output: DatabaseLocation = {
      id: expect.anything(),
      type: 'a',
      target: 'b',
    };

    await db.addLocation(input);

    const locations = await db.locations();
    expect(locations).toEqual([output]);
    const location = await db.location(locations[0].id);
    expect(location).toEqual(output);

    await db.removeLocation(locations[0].id);

    await expect(db.locations()).resolves.toEqual([]);
    await expect(db.location(locations[0].id)).rejects.toThrow(
      /Found no location/,
    );
  });

  it('instead of adding second location with the same target, returns existing one', async () => {
    // Prepare
    const catalog = new Database(database);
    const input: AddDatabaseLocation = { type: 'a', target: 'b' };
    const output1: DatabaseLocation = await catalog.addLocation(input);

    // Try to insert the same location
    const output2: DatabaseLocation = await catalog.addLocation(input);
    const locations = await catalog.locations();

    // Output is the same
    expect(output2).toEqual(output1);
    // Locations contain only one record
    expect(locations).toEqual([output1]);
  });

  describe('addOrUpdateEntity', () => {
    it('happy path: adds entity to empty database', async () => {
      const catalog = new Database(database);
      await expect(
        catalog.addOrUpdateEntity(entityRequest),
      ).resolves.toStrictEqual(entityResponse);
    });

    it('rejects new entity with user-chosen uid', async () => {
      const catalog = new Database(database);

      const input = entityRequest;
      input.entity.metadata!.uid = 'hello';

      await expect(catalog.addOrUpdateEntity(input)).rejects.toThrow(
        ConflictError,
      );
    });
  });
});
