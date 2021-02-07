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
import React from 'react';
import { render, waitFor, fireEvent, act } from '@testing-library/react';
import { SplunkOnCallCard } from './SplunkOnCallCard';
import { Entity } from '@backstage/catalog-model';
import { wrapInTestApp } from '@backstage/test-utils';
import {
  alertApiRef,
  ApiProvider,
  ApiRegistry,
  createApiRef,
} from '@backstage/core';
import {
  splunkOnCallApiRef,
  UnauthorizedError,
  SplunkOnCallClient,
} from '../api';
import {
  MOCKED_ON_CALL,
  MOCKED_USER,
  MOCK_INCIDENT,
  MOCK_TEAM,
} from '../api/mocks';

const mockSplunkOnCallApi: Partial<SplunkOnCallClient> = {
  getUsers: async () => [],
  getIncidents: async () => [MOCK_INCIDENT],
  getOnCallUsers: async () => MOCKED_ON_CALL,
  getTeams: async () => [MOCK_TEAM],
};

const apis = ApiRegistry.from([
  [splunkOnCallApiRef, mockSplunkOnCallApi],
  [
    alertApiRef,
    createApiRef({
      id: 'core.alert',
      description: 'Used to report alerts and forward them to the app',
    }),
  ],
]);
const entity: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'splunkoncall-test',
    annotations: {
      'splunkoncall.com/integration-key': 'abc123',
    },
  },
};

describe('PageDutyCard', () => {
  it('Render splunkoncall', async () => {
    mockSplunkOnCallApi.getUsers = jest
      .fn()
      .mockImplementationOnce(async () => [MOCKED_USER]);

    const { getByText, queryByTestId } = render(
      wrapInTestApp(
        <ApiProvider apis={apis}>
          <SplunkOnCallCard entity={entity} />
        </ApiProvider>,
      ),
    );
    await waitFor(() => !queryByTestId('progress'));
    expect(getByText('Create Incident')).toBeInTheDocument();
    expect(getByText('Nice! No incidents found!')).toBeInTheDocument();
    expect(getByText('Empty escalation policy')).toBeInTheDocument();
  });

  it('Handles custom error for missing token', async () => {
    mockSplunkOnCallApi.getUsers = jest
      .fn()
      .mockRejectedValueOnce(new UnauthorizedError());

    const { getByText, queryByTestId } = render(
      wrapInTestApp(
        <ApiProvider apis={apis}>
          <SplunkOnCallCard entity={entity} />
        </ApiProvider>,
      ),
    );
    await waitFor(() => !queryByTestId('progress'));
    expect(
      getByText('Missing or invalid SplunkOnCall Token'),
    ).toBeInTheDocument();
  });

  it('handles general error', async () => {
    mockSplunkOnCallApi.getUsers = jest
      .fn()
      .mockRejectedValueOnce(new Error('An error occurred'));
    const { getByText, queryByTestId } = render(
      wrapInTestApp(
        <ApiProvider apis={apis}>
          <SplunkOnCallCard entity={entity} />
        </ApiProvider>,
      ),
    );
    await waitFor(() => !queryByTestId('progress'));

    expect(
      getByText(
        'Error encountered while fetching information. An error occurred',
      ),
    ).toBeInTheDocument();
  });
  it('opens the dialog when trigger button is clicked', async () => {
    mockSplunkOnCallApi.getUsers = jest
      .fn()
      .mockImplementationOnce(async () => [MOCKED_USER]);

    const { getByText, queryByTestId, getByTestId, getByRole } = render(
      wrapInTestApp(
        <ApiProvider apis={apis}>
          <SplunkOnCallCard entity={entity} />
        </ApiProvider>,
      ),
    );
    await waitFor(() => !queryByTestId('progress'));
    expect(getByText('Create Incident')).toBeInTheDocument();
    const triggerButton = getByTestId('trigger-button');
    await act(async () => {
      fireEvent.click(triggerButton);
    });
    expect(getByRole('dialog')).toBeInTheDocument();
  });
});