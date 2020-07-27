import { DynamoDBStreamEvent } from 'aws-lambda';
import log from 'lambda-log';
import { handler } from './buildCirculationTable';
import CircleModel from '../../../interfaces/dynamo/circlesModel';
import UpcomingCirculationModel from '../../../interfaces/dynamo/upcomingCirculationModel';

// eslint-disable-next-line
const MockInsertEvent: DynamoDBStreamEvent = require('../../__mocks__/mockContentInsertEvent.json');

jest.mock('../../../interfaces/dynamo/circlesModel', () => ({
  batchGet: jest.fn(() =>
    Promise.resolve([
      {
        original: () => ({
          id: 'mock-circle-id-1',
          members: ['dev-id'],
          frequency: 'daily',
        }),
      },
      {
        original: () => ({
          id: 'mock-circle-id-2',
          members: ['dev-id, someOtherId'],
          frequency: 'weekly',
        }),
      },
      {
        original: () => ({
          id: 'mock-circle-id-3',
          members: ['NOT-dev-id'],
          frequency: 'weekly',
        }),
      },
    ])
  ),
}));
jest.mock('../../../interfaces/dynamo/upcomingCirculationModel', () => ({
  get: jest.fn(() => Promise.resolve(true)),
  update: jest.fn(() => Promise.resolve(true)),
  create: jest.fn(() => Promise.resolve(true)),
}));

describe('buildCirculationTable', () => {
  const circleBatchGetSpy = jest.spyOn(CircleModel, 'batchGet');
  const upcomingCirculationCreateSpy = jest.spyOn(
    UpcomingCirculationModel,
    'create'
  );
  const upcomingCirculationUpdateSpy = jest.spyOn(
    UpcomingCirculationModel,
    'update'
  );
  const upcomingCirculationGetSpy = jest.spyOn(UpcomingCirculationModel, 'get');

  const logErrorSpy = jest.spyOn(log, 'error');

  beforeEach(() => {
    circleBatchGetSpy.mockClear();
    upcomingCirculationCreateSpy.mockClear();
    upcomingCirculationUpdateSpy.mockClear();
    upcomingCirculationGetSpy.mockClear();
    logErrorSpy.mockClear();
  });

  describe('Happy path', () => {
    it('Should return void', async () => {
      const resp = await handler(MockInsertEvent, null, null);
      expect(resp).toBe(undefined);
    });
    describe('When given INSERT events', () => {
      it('Should call CircleModel.batchGet with each circle id in the event', async () => {
        await handler(MockInsertEvent, null, null);
        expect(circleBatchGetSpy).toHaveBeenCalledWith([
          '08ee2184-1a4c-454a-bfa0-ee3c77917be1',
        ]);
      });
      it('Should call UpcomingCirculationModel.get for each member id in the Circle', async () => {
        await handler(MockInsertEvent, null, null);
        expect(upcomingCirculationGetSpy).toHaveBeenCalledTimes(3);
        expect(upcomingCirculationGetSpy).toHaveBeenNthCalledWith(
          1,
          'dev-id:daily'
        );
        expect(upcomingCirculationGetSpy).toHaveBeenNthCalledWith(
          2,
          'dev-id, someOtherId:weekly'
        );
        expect(upcomingCirculationGetSpy).toHaveBeenNthCalledWith(
          3,
          'NOT-dev-id:weekly'
        );
      });

      describe('When the Upcoming Circulation exists', () => {
        beforeEach(() => {
          upcomingCirculationGetSpy.mockImplementationOnce(() =>
            Promise.resolve(true)
          );
        });
        it('Should call UpcomingCirculationModel.update for each member', async () => {
          await handler(MockInsertEvent, null, null);
          expect(upcomingCirculationUpdateSpy).toHaveBeenNthCalledWith(
            1,
            { urn: 'dev-id:daily' },
            { $ADD: { circles: ['mock-circle-id-1'] } }
          );
          expect(upcomingCirculationUpdateSpy).toHaveBeenNthCalledWith(
            2,
            { urn: 'dev-id, someOtherId:weekly' },
            { $ADD: { circles: ['mock-circle-id-2'] } }
          );
          expect(upcomingCirculationUpdateSpy).toHaveBeenNthCalledWith(
            3,
            { urn: 'NOT-dev-id:weekly' },
            { $ADD: { circles: ['mock-circle-id-3'] } }
          );
        });
      });
      describe('When the Upcoming Circulation does not exist', () => {
        beforeEach(() => {
          upcomingCirculationGetSpy.mockImplementation(() =>
            Promise.resolve(false)
          );
        });
        it('Should call UpcomingCirculationModel.create', async () => {
          await handler(MockInsertEvent, null, null);
          expect(upcomingCirculationCreateSpy).toHaveBeenCalledTimes(3);
          expect(upcomingCirculationCreateSpy).toHaveBeenNthCalledWith(1, {
            circles: ['mock-circle-id-1'],
            circulationId: expect.any(String),
            urn: 'dev-id:daily',
            userId: 'dev-id',
          });
          expect(upcomingCirculationCreateSpy).toHaveBeenNthCalledWith(2, {
            circles: ['mock-circle-id-2'],
            circulationId: expect.any(String),
            urn: 'dev-id, someOtherId:weekly',
            userId: 'dev-id, someOtherId',
          });
          expect(upcomingCirculationCreateSpy).toHaveBeenNthCalledWith(3, {
            circles: ['mock-circle-id-3'],
            circulationId: expect.any(String),
            urn: 'NOT-dev-id:weekly',
            userId: 'NOT-dev-id',
          });
        });
      });
    });
  });
});