import log from 'lambda-log';

import { CreateMockEvent, CreateMockContext } from '../testUtils';
import { handler } from './getCirclePreviewById';
import CircleModel from '../../interfaces/dynamo/circlesModel';
import UserModel from '../../interfaces/dynamo/userModel';

jest.mock('../../interfaces/dynamo/circlesModel', () => ({
  get: jest.fn(() =>
    Promise.resolve({
      original: () => ({
        upcomingContentIds: ['425293dd-ac0e-49b3-931b-8293c82c5502'],
        content: ['425293dd-ac0e-49b3-931b-8293c82c5502'],
        privacy: 'public',
        updatedAt: 1592688117024,
        members: ['dev-id', 'asdf-123'],
        createdAt: 1592687256669,
        description: 'Test desc',
        id: '8c03b5c6-829a-4d91-80d9-e3c386af6839',
        createdBy: 'dev-id',
        name: 'Test',
      }),
    })
  ),
}));

jest.mock('../../interfaces/dynamo/userModel', () => ({
  batchGet: jest.fn(() =>
    Promise.resolve([
      {
        id: 'dev-id',
        firstName: 'Mike',
        lastName: 'Alicea',
        email: 'mikeA@circulate.social',
      },
      {
        id: 'asdf-123',
        firstName: 'Bill',
        lastName: 'Nye',
        email: 'bill@circulate.social',
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

describe('getCirclePreviewById', () => {
  describe('Happy path', () => {
    it('Should call CircleModel.get with the `pathParameters.circleId`', async () => {
      const circleModelGetSpy = jest.spyOn(CircleModel, 'get');
      await handler(MOCK_EVENT, MOCK_CONTEXT, null);
      expect(circleModelGetSpy).toHaveBeenCalledWith(
        MOCK_EVENT.pathParameters.circleId
      );
    });
    it('Should call UserModel.batchGet with the `CircleModel.members` array', async () => {
      const circleModelGetSpy = jest.spyOn(UserModel, 'batchGet');
      await handler(MOCK_EVENT, MOCK_CONTEXT, null);
      expect(circleModelGetSpy).toHaveBeenCalledWith(['dev-id', 'asdf-123']);
    });
    it('Should return a 200 with the results from CircleModel.get and members filled out', async () => {
      const mockEvent = genMockEvent(undefined, undefined);
      const resp = await handler(mockEvent, MOCK_CONTEXT, null);

      expect(resp).toEqual(
        expect.objectContaining({
          statusCode: 200,
          body:
            '{"circlePreview":{"circleId":"8c03b5c6-829a-4d91-80d9-e3c386af6839","createdAt":1592687256669,"updatedAt":1592688117024,"creatorName":"Mike A","memberNames":["Mike A","Bill N"],"memberIds":["dev-id","asdf-123"],"name":"Test","description":"Test desc","totalContentCount":1,"upcomingContentCount":1,"privacy":"public"}}',
        })
      );
    });
  });

  describe('Unhappy path', () => {
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
  });
});
