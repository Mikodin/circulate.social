import log from 'lambda-log';
import { Circle } from '@circulate/types';

import { handler } from './leaveCircle';
import { CreateMockEvent, CreateMockContext } from '../testUtils';
import CircleModel from '../../interfaces/dynamo/circlesModel';

const mockUserId = 'dev-id';
const mockCircle = {
  id: 'someCircle',
  createdAt: '123',
  updatedAt: '123',
  members: ['dev-id'],
  createdBy: 'dev-id',
  name: 'The greatest circle',
  description: 'Great things happen here',
  frequency: 'daily',
  privacy: 'private',
} as Circle;

jest.mock('../../interfaces/dynamo/circlesModel', () => ({
  get: jest.fn(() =>
    Promise.resolve({
      original: () => mockCircle,
    })
  ),
  delete: jest.fn(() => Promise.resolve()),
  update: jest.fn(() =>
    Promise.resolve({
      original: () => mockCircle,
    })
  ),
}));

const MOCK_EVENT_CONTEXT = {
  authorizer: {
    claims: {
      'cognito:username': mockUserId,
      email_verified: true,
    },
  },
};

const mockCircleIdPathParameter = mockCircle.id;
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

describe('leaveCircle', () => {
  describe('Happy path', () => {
    it('Should fetch the Circle by the pathParameter id', async () => {
      const circleModelGetSpy = jest.spyOn(CircleModel, 'get');
      await handler(MOCK_EVENT, MOCK_CONTEXT, null);
      expect(circleModelGetSpy).toHaveBeenCalled();
    });

    describe('If the user is not in the Circle that is fetched', () => {
      const circleModelGetSpy = jest.spyOn(CircleModel, 'get');
      beforeEach(() => {
        circleModelGetSpy.mockResolvedValueOnce({
          // @ts-expect-error
          original: () => ({ ...mockCircle, members: ['not-our-user'] }),
        });
      });
      it('Should return a 401 status code and a body with success:false', async () => {
        const res = await handler(MOCK_EVENT, MOCK_CONTEXT, null);
        const statusCode = res && res.statusCode;
        const body = res && JSON.parse(res.body);

        expect(statusCode).toEqual(401);
        expect(body).toEqual({
          left: {
            circleId: 'someCircle',
            success: false,
          },
          message: 'Sorry, you are not a member of this circle',
        });
      });
    });

    describe('When there is only 1 member in the Circle', () => {
      const circleModelGetSpy = jest.spyOn(CircleModel, 'get');
      beforeEach(() => {
        circleModelGetSpy.mockResolvedValueOnce({
          // @ts-expect-error
          original: () => ({ ...mockCircle, members: [mockUserId] }),
        });
      });

      it('Should call CircleModel.delete with the pathParameters.circleId', async () => {
        const circleModelDeleteSpy = jest.spyOn(CircleModel, 'delete');
        await handler(MOCK_EVENT, MOCK_CONTEXT, null);
        expect(circleModelDeleteSpy).toHaveBeenCalledWith(mockCircle.id);
      });

      it('Should return a 200 with "left: { success: true, circleId, deleted: true }"', async () => {
        const res = await handler(MOCK_EVENT, MOCK_CONTEXT, null);
        if (res) {
          const body = JSON.parse(res.body);
          expect(res.statusCode).toEqual(200);
          expect(body).toEqual({
            left: {
              circleId: 'someCircle',
              deleted: true,
              success: true,
            },
            message: 'Successfully deleted the Circle',
          });
        }
      });
    });

    describe('When there are multiple members in the Circle', () => {
      const circleModelGetSpy = jest.spyOn(CircleModel, 'get');
      const circleModelUpdateSpy = jest.spyOn(CircleModel, 'update');
      beforeEach(() => {
        circleModelUpdateSpy.mockClear();
        circleModelGetSpy.mockResolvedValueOnce({
          // @ts-expect-error
          original: () => ({ ...mockCircle, members: [mockUserId, 'test-id'] }),
        });
      });
      it('Should call CircleModel.update with the pathParameters.circleId and the member removed', async () => {
        await handler(MOCK_EVENT, MOCK_CONTEXT, null);
        expect(circleModelUpdateSpy).toHaveBeenCalledWith(
          { id: 'someCircle' },
          { $SET: { members: ['test-id'] } }
        );
      });

      it('Should return a 200 with "left: { success: true, circleId, deleted: false }"', async () => {
        const res = await handler(MOCK_EVENT, MOCK_CONTEXT, null);
        if (res) {
          const body = JSON.parse(res.body);
          expect(res.statusCode).toEqual(200);
          expect(body).toEqual({
            left: {
              circleId: 'someCircle',
              deleted: false,
              success: true,
            },
            message: 'Successfully left the Circle',
          });
        }
      });
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
    describe('When CircleModel.delete throws an error', () => {
      const circleModelUpdateSpy = jest.spyOn(CircleModel, 'delete');
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
              '{"message":"Something went wrong trying to leave or delete the circle"}',
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
