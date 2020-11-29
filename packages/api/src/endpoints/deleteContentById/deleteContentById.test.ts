import log from 'lambda-log';
import { Content } from '@circulate/types';

import { handler } from './deleteContentById';
import { CreateMockEvent, CreateMockContext } from '../testUtils';
import ContentModel from '../../interfaces/dynamo/contentModel';

const mockUserId = 'dev-id';
const mockContent = {
  id: 'someId',
  createdBy: 'dev-id',
  title: 'This is some amazing content',
  circleIds: ['some-circle-id'],
  privacy: 'private',
  description: 'This is a description',
  link: 'www.beta.circulate.social',
  createdAt: '2020-11-29T01:19:37.457Z',
  updatedAt: '2020-11-29T01:19:37.457Z',
} as Content;

jest.mock('../../interfaces/dynamo/contentModel', () => ({
  get: jest.fn(() =>
    Promise.resolve({
      original: () => mockContent,
    })
  ),
  delete: jest.fn(() => Promise.resolve()),
}));

const MOCK_EVENT_CONTEXT = {
  authorizer: {
    claims: {
      'cognito:username': mockUserId,
      email_verified: true,
    },
  },
};

const mockContentIdPathParameter = mockContent.id;
function genMockEvent(
  pathParameters?: Record<string, string>,
  eventContext?: Record<string, unknown>
) {
  return CreateMockEvent({
    pathParameters: {
      contentId: mockContentIdPathParameter,
      ...pathParameters,
    },
    requestContext: { ...MOCK_EVENT_CONTEXT, ...eventContext },
  });
}

const MOCK_EVENT = genMockEvent();
const MOCK_CONTEXT = CreateMockContext({});

describe('deleteContentById', () => {
  describe('Happy path', () => {
    it('Should fetch the Content by the pathParameter id', async () => {
      const contentModelGetSpy = jest.spyOn(ContentModel, 'get');
      await handler(MOCK_EVENT, MOCK_CONTEXT, null);
      expect(contentModelGetSpy).toHaveBeenCalled();
    });

    describe('If the Content does not exist', () => {
      const contentModelGetSpy = jest.spyOn(ContentModel, 'get');
      beforeEach(() => {
        // @ts-expect-error
        contentModelGetSpy.mockResolvedValueOnce(undefined);
      });

      it('Should return a 404 status code and a body with success:false', async () => {
        const res = await handler(MOCK_EVENT, MOCK_CONTEXT, null);
        const statusCode = res && res.statusCode;
        const body = res && JSON.parse(res.body);

        expect(statusCode).toEqual(404);
        expect(body).toEqual({
          deleted: {
            contentId: mockContentIdPathParameter,
            success: false,
            deleted: false,
          },
          message: 'Content with id:[someId] was not found',
        });
      });
    });

    describe('If the user is not the creator of the Content', () => {
      const contentModelGetSpy = jest.spyOn(ContentModel, 'get');
      beforeEach(() => {
        contentModelGetSpy.mockResolvedValueOnce({
          // @ts-expect-error
          original: () => ({ ...mockContent, createdBy: 'not-our-user' }),
        });
      });
      it('Should return a 401 status code and a body with success:false', async () => {
        const res = await handler(MOCK_EVENT, MOCK_CONTEXT, null);
        const statusCode = res && res.statusCode;
        const body = res && JSON.parse(res.body);

        expect(statusCode).toEqual(401);
        expect(body).toEqual({
          deleted: {
            contentId: mockContent.id,
            success: false,
            deleted: false,
          },
          message:
            'You do not have permission to delete this content as you are not the creator',
        });
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
    describe('When ContentModel.delete throws an error', () => {
      const contentModelUpdateSpy = jest.spyOn(ContentModel, 'delete');
      beforeEach(() => {
        contentModelUpdateSpy.mockImplementationOnce(() =>
          Promise.reject(false)
        );
      });
      it('Should return a 500', async () => {
        const resp = await handler(MOCK_EVENT, MOCK_CONTEXT, null);
        expect(resp).toEqual(
          expect.objectContaining({
            statusCode: 500,
            body:
              '{"message":"Something went wrong trying to delete the content"}',
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
