import log from 'lambda-log';

import { CreateMockEvent, CreateMockContext } from '../testUtils';
import { handler } from './getCircleById';
import CircleModel from '../../interfaces/dynamo/circlesModel';
import ContentModel from '../../interfaces/dynamo/contentModel';

jest.mock('../../interfaces/dynamo/circlesModel', () => ({
  get: jest.fn(() =>
    Promise.resolve({
      original: () => ({
        content: ['425293dd-ac0e-49b3-931b-8293c82c5502'],
        privacy: 'public',
        updatedAt: 1592688117024,
        members: ['dev-id'],
        createdAt: 1592687256669,
        description: 'Test desc',
        id: '8c03b5c6-829a-4d91-80d9-e3c386af6839',
        createdBy: 'dev-id',
        name: 'Test',
      }),
    })
  ),
}));

jest.mock('../../interfaces/dynamo/contentModel', () => ({
  batchGet: jest.fn(() =>
    Promise.resolve([
      {
        dateTime: '2020-05-23T23:00Z[UTC]',
        circleIds: ['8c03b5c6-829a-4d91-80d9-e3c386af6839'],
        privacy: 'private',
        categories: {},
        updatedAt: '2020-06-20T21:21:56.880Z',
        createdAt: '2020-06-20T21:21:56.880Z',
        link: 'Test.com',
        description: 'Test desc',
        id: '425293dd-ac0e-49b3-931b-8293c82c5502',
        createdBy: 'dev-id',
        tags: {},
        title: 'Test Content11',
      },
    ])
  ),
}));

const MOCK_EVENT_CONTEXT = {
  authorizer: {
    claims: {
      'cognito:username': 'dev-id',
      email_verified: true,
    },
  },
};

function genMockEvent(
  pathParameters?: Record<string, unknown>,
  queryStringParameters?: Record<string, unknown>,
  context?: Record<string, unknown>
) {
  return CreateMockEvent({
    pathParameters: {
      circleId: '8c03b5c6-829a-4d91-80d9-e3c386af6839',
      ...pathParameters,
    },
    queryStringParameters: { ...queryStringParameters },
    requestContext: { ...MOCK_EVENT_CONTEXT, ...context },
  });
}
const MOCK_EVENT = genMockEvent();
const MOCK_CONTEXT = CreateMockContext({});

describe('getCircleById', () => {
  describe('Happy path', () => {
    it('Should call CircleModel.get with the `pathParameters.circleId`', async () => {
      const circleModelGetSpy = jest.spyOn(CircleModel, 'get');
      await handler(MOCK_EVENT, MOCK_CONTEXT, null);
      expect(circleModelGetSpy).toHaveBeenCalledWith(
        MOCK_EVENT.pathParameters.circleId
      );
    });
    it('Should return a 200 with the results from CircleModel.get', async () => {
      const resp = await handler(MOCK_EVENT, MOCK_CONTEXT, null);
      expect(resp).toEqual(
        expect.objectContaining({
          statusCode: 200,
          body:
            '{"circle":{"content":["425293dd-ac0e-49b3-931b-8293c82c5502"],"privacy":"public","updatedAt":1592688117024,"members":["dev-id"],"createdAt":1592687256669,"description":"Test desc","id":"8c03b5c6-829a-4d91-80d9-e3c386af6839","createdBy":"dev-id","name":"Test"}}',
        })
      );
    });

    describe('When getContentDetails queryString paramter is there', () => {
      it('Should call ContentModel.batchGet(circle.content)', async () => {
        const contentModelBatchGetSpy = jest.spyOn(ContentModel, 'batchGet');
        const mockEvent = genMockEvent(undefined, { getContentDetails: true });
        await handler(mockEvent, MOCK_CONTEXT, null);
        expect(contentModelBatchGetSpy).toHaveBeenCalledWith([
          '425293dd-ac0e-49b3-931b-8293c82c5502',
        ]);
      });
      it('Should return a 200, with contentDetails filled out with the results from ContentModel.batchGet', async () => {
        const mockEvent = genMockEvent(undefined, { getContentDetails: true });
        const resp = await handler(mockEvent, MOCK_CONTEXT, null);
        expect(resp).toEqual(
          expect.objectContaining({
            statusCode: 200,
            body:
              '{"circle":{"content":["425293dd-ac0e-49b3-931b-8293c82c5502"],"privacy":"public","updatedAt":1592688117024,"members":["dev-id"],"createdAt":1592687256669,"description":"Test desc","id":"8c03b5c6-829a-4d91-80d9-e3c386af6839","createdBy":"dev-id","name":"Test","contentDetails":[{"dateTime":"2020-05-23T23:00Z[UTC]","circleIds":["8c03b5c6-829a-4d91-80d9-e3c386af6839"],"privacy":"private","categories":{},"updatedAt":"2020-06-20T21:21:56.880Z","createdAt":"2020-06-20T21:21:56.880Z","link":"Test.com","description":"Test desc","id":"425293dd-ac0e-49b3-931b-8293c82c5502","createdBy":"dev-id","tags":{},"title":"Test Content11"}]}}',
          })
        );
      });
    });
  });

  describe('Unhappy path', () => {
    describe('When the user is not logged in or is not email verified', () => {
      it('Should return a 401 if the user is not email verified', async () => {
        const notEmailVerifiedEventContext = {
          authorizer: {
            claims: {
              'cognito:username': 'dev-id',
              email_verified: false,
            },
          },
        };

        const mockEvent = genMockEvent(
          undefined,
          undefined,
          notEmailVerifiedEventContext
        );
        const resp = await handler(mockEvent, MOCK_CONTEXT, null);
        expect(resp).toEqual(
          expect.objectContaining({
            statusCode: 401,
          })
        );
      });
    });

    describe('When the `pathParameters.circleId` is not found in the DB', () => {
      it('Should return a 404 not found', async () => {
        const circleModelGetSpy = jest.spyOn(CircleModel, 'get');
        circleModelGetSpy.mockImplementationOnce(() =>
          Promise.resolve(undefined)
        );
        const resp = await handler(MOCK_EVENT, MOCK_CONTEXT, null);
        expect(resp).toEqual(
          expect.objectContaining({
            statusCode: 404,
            body:
              '{"message":"A Circle with id:[8c03b5c6-829a-4d91-80d9-e3c386af6839] was not found"}',
          })
        );
      });
    });

    describe('When the user is fetching a Circle that they are not a member of', () => {
      it('Should return a 401', async () => {
        const circleModelGetSpy = jest.spyOn(CircleModel, 'get');
        circleModelGetSpy.mockImplementationOnce(() =>
          Promise.resolve({
            original: () => ({
              content: ['425293dd-ac0e-49b3-931b-8293c82c5502'],
              privacy: 'public',
              updatedAt: 1592688117024,
              members: ['SOMEONE WHO ISNT THE MEMBER'],
              createdAt: 1592687256669,
              description: 'Test desc',
              id: '8c03b5c6-829a-4d91-80d9-e3c386af6839',
              createdBy: 'dev-id',
              name: 'Test',
            }),
          })
        );

        const resp = await handler(MOCK_EVENT, MOCK_CONTEXT, null);
        expect(resp).toEqual(
          expect.objectContaining({
            statusCode: 401,
            body: '{"message":"You are not authorized to access this circle"}',
          })
        );
      });
    });
  });

  describe('Error path', () => {
    describe('When CircleModel.get returns an error', () => {
      it('Should return a 500', async () => {
        const circleModelGetSpy = jest.spyOn(CircleModel, 'get');
        circleModelGetSpy.mockImplementationOnce(() => Promise.reject(false));

        const resp = await handler(MOCK_EVENT, MOCK_CONTEXT, null);
        expect(resp).toEqual(
          expect.objectContaining({
            statusCode: 500,
          })
        );
      });
      it('Should call log.error', async () => {
        const circleModelGetSpy = jest.spyOn(CircleModel, 'get');
        circleModelGetSpy.mockImplementationOnce(() => Promise.reject(false));

        const logErrorSpy = jest.spyOn(log, 'error');

        await handler(MOCK_EVENT, MOCK_CONTEXT, null);
        expect(logErrorSpy).toHaveBeenCalled();
      });
    });

    describe('When ContentModel.batchGet returns an error', () => {
      it('Should return a 500', async () => {
        const ContentModelBatchGetSpy = jest.spyOn(ContentModel, 'batchGet');
        ContentModelBatchGetSpy.mockImplementationOnce(() =>
          Promise.reject(false)
        );

        const mockEvent = genMockEvent(undefined, { getContentDetails: true });
        const resp = await handler(mockEvent, MOCK_CONTEXT, null);
        expect(resp).toEqual(
          expect.objectContaining({
            statusCode: 500,
          })
        );
      });
      it('Should call log.error', async () => {
        const ContentModelBatchGetSpy = jest.spyOn(ContentModel, 'batchGet');
        ContentModelBatchGetSpy.mockImplementationOnce(() =>
          Promise.reject(false)
        );

        const logErrorSpy = jest.spyOn(log, 'error');

        const mockEvent = genMockEvent(undefined, { getContentDetails: true });
        await handler(mockEvent, MOCK_CONTEXT, null);
        expect(logErrorSpy).toHaveBeenCalled();
      });
    });
  });
});
