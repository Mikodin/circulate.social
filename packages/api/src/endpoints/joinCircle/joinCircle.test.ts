import log from 'lambda-log';
import { handler } from './joinCircle';

import { CreateMockEvent, CreateMockContext } from '../testUtils';
import CircleModel from '../../interfaces/dynamo/circlesModel';

jest.mock('../../interfaces/dynamo/circlesModel', () => ({
  update: jest.fn(() =>
    Promise.resolve({
      original: () => ({ id: 'asdf-123' }),
    })
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

const mockCircleIdPathParameter = 'asdf-123';
function genMockEvent(
  pathParameters?: Record<string, string>,
  eventContext?: Record<string, unknown>
) {
  return CreateMockEvent({
    pathParameters: { circleId: mockCircleIdPathParameter, ...pathParameters },
    requestContext: { ...MOCK_EVENT_CONTEXT, ...eventContext },
  });
}

const MOCK_EVENT = genMockEvent();
const MOCK_CONTEXT = CreateMockContext({});

describe('joinCircle', () => {
  describe('Happy path', () => {
    it('Should call CircleModel.update with the pathParameters.circleId', async () => {
      const circleModelUpdateSpy = jest.spyOn(CircleModel, 'update');
      await handler(MOCK_EVENT, MOCK_CONTEXT, null);
      expect(circleModelUpdateSpy).toHaveBeenCalledWith(
        {
          id: 'asdf-123',
        },
        { $ADD: { members: ['dev-id'] } }
      );
    });
    it('Should return a 200 with { success: true, circleId: pathParameters.circleId }', async () => {
      const resp = await handler(MOCK_EVENT, MOCK_CONTEXT, null);
      expect(resp).toEqual(
        expect.objectContaining({
          statusCode: 200,
          body:
            '{"message":"Success","joined":{"success":true,"circleId":"asdf-123"}}',
        })
      );
    });
  });

  describe('Unhappy path', () => {
    describe('When the user has not confirmed their email', () => {
      const emailNotVerifiedEventAuthorizer = {
        authorizer: {
          claims: {
            'cognito:username': 'dev-id',
            email_verified: false,
          },
        },
      };
      it('Should return a 401', async () => {
        const resp = await handler(
          genMockEvent(undefined, emailNotVerifiedEventAuthorizer),
          MOCK_CONTEXT,
          null
        );
        expect(resp).toEqual(
          expect.objectContaining({
            statusCode: 401,
            body: '{"message":"Please verify your email address"}',
          })
        );
      });
    });
  });

  describe('Catastrophic path', () => {
    describe('When CircleModel.update throws an error', () => {
      const circleModelUpdateSpy = jest.spyOn(CircleModel, 'update');
      beforeEach(() => {
        circleModelUpdateSpy.mockImplementationOnce(() =>
          Promise.reject(false)
        );
      });
      it('Should return a 500', async () => {
        const resp = await handler(MOCK_EVENT, MOCK_CONTEXT, null);
        expect(resp).toEqual(
          expect.objectContaining({
            statusCode: 500,
            body:
              '{"message":"Something went wrong trying to join the circle"}',
          })
        );
      });
      it('Should call log.error', async () => {
        const logErrorSpy = jest.spyOn(log, 'error');
        await handler(MOCK_EVENT, MOCK_CONTEXT, null);
        expect(logErrorSpy).toHaveBeenCalled();
      });
    });
  });
});
