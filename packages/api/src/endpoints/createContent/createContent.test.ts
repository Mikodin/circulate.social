import log from 'lambda-log';
import { CreateMockEvent, CreateMockContext } from '../testUtils';
import { handler } from './createContent';
import CircleModel from '../../interfaces/dynamo/circlesModel';
import ContentModel from '../../interfaces/dynamo/contentModel';

jest.mock('../../interfaces/dynamo/circlesModel', () => ({
  batchGet: jest.fn(() =>
    Promise.resolve([
      {
        original: () => ({
          id: 'mock-circle-id-1',
          members: ['dev-id'],
        }),
      },
      {
        original: () => ({
          id: 'mock-circle-id-2',
          members: ['dev-id'],
        }),
      },
      {
        original: () => ({
          id: 'mock-circle-id-3',
          members: ['NOT-dev-id'],
        }),
      },
    ])
  ),
  update: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('../../interfaces/dynamo/contentModel', () => ({
  create: jest.fn(() => Promise.resolve({ id: 'mock-content-1' })),
}));

const MOCK_EVENT_BODY = {
  title: 'Test',
  description: 'Test desc',
  privacy: 'private',
  circleId: ['mock-circle-id-1', 'mock-circle-id-2'],
  tags: ['test'],
  categories: ['TestCat'],
  dateTime: '2020-05-23T16:00-07:00[America/Los_Angeles]',
  link: 'Test.com',
};

const MOCK_EVENT_CONTEXT = {
  authorizer: {
    claims: {
      'cognito:username': 'dev-id',
      email_verified: true,
    },
  },
};

function genMockEvent(
  body?: Record<string, unknown>,
  context?: Record<string, unknown>
) {
  return CreateMockEvent({
    body: { ...MOCK_EVENT_BODY, ...body },
    requestContext: { ...MOCK_EVENT_CONTEXT, ...context },
  });
}
const MOCK_CONTEXT = CreateMockContext({});

describe('createContent', () => {
  describe('Happy path', () => {
    describe('Parsing DateTime', () => {
      it('Should convert the passed in dateTime to UTC', async () => {
        const createSpy = jest.spyOn(ContentModel, 'create');
        await handler(
          genMockEvent({
            dateTime: '2020-05-23T16:00-07:00[America/Los_Angeles]',
          }),
          MOCK_CONTEXT,
          null
        );
        expect(createSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            dateTime: '2020-05-23T23:00Z[UTC]',
          })
        );
      });
    });
    describe('Fetching Circles passed in', () => {
      const circleModelBatchGetSpy = jest.spyOn(CircleModel, 'batchGet');
      beforeEach(() => {
        circleModelBatchGetSpy.mockClear();
      });
      it('Should fetch all circles that are passed in', async () => {
        await handler(
          genMockEvent({
            circleId: ['circle1', 'circle2'],
          }),
          MOCK_CONTEXT,
          null
        );
        expect(circleModelBatchGetSpy).toHaveBeenCalledWith([
          { id: 'circle1' },
          { id: 'circle2' },
        ]);
      });

      it('Should handle a single string circleId', async () => {
        await handler(
          genMockEvent({
            circleId: 'circle1',
          }),
          MOCK_CONTEXT,
          null
        );
        expect(circleModelBatchGetSpy).toHaveBeenCalledWith([
          { id: 'circle1' },
        ]);
      });
    });

    describe('Creating Content in the DB', () => {
      const contentModelCreateSpy = jest.spyOn(ContentModel, 'create');
      beforeEach(() => {
        contentModelCreateSpy.mockClear();
      });
      it('Should Create the content in the DB', async () => {
        await handler(genMockEvent(), MOCK_CONTEXT, null);
        expect(contentModelCreateSpy).toHaveBeenCalledWith({
          categories: ['TestCat'],
          circleIds: ['mock-circle-id-1', 'mock-circle-id-2'],
          createdBy: 'dev-id',
          dateTime: '2020-05-23T23:00Z[UTC]',
          description: 'Test desc',
          // uuidv4
          id: expect.any(String),
          link: 'Test.com',
          privacy: 'private',
          tags: ['test'],
          title: 'Test',
        });
      });
      it('Should only contain circleIds that the user is a MEMBER of', async () => {
        await handler(genMockEvent(), MOCK_CONTEXT, null);
        expect(contentModelCreateSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            circleIds: ['mock-circle-id-1', 'mock-circle-id-2'],
          })
        );
      });
    });

    describe('Updating Circles with the added Content', () => {
      const circleModelUpdateSpy = jest.spyOn(CircleModel, 'update');
      beforeEach(() => {
        circleModelUpdateSpy.mockClear();
      });

      it('Should update _each Circle the member is in_ with the added Content', async () => {
        await handler(
          genMockEvent({
            circleId: [
              'mock-circle-id-1',
              'mock-circle-id-2',
              // Look at the mock, this id has no memberId that matches `dev-id`
              'mock-circle-id-3',
            ],
          }),
          MOCK_CONTEXT,
          null
        );
        expect(circleModelUpdateSpy).toHaveBeenCalledWith(
          {
            id: 'mock-circle-id-1',
          },
          { $ADD: { content: 'mock-content-1' } }
        );
        expect(circleModelUpdateSpy).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Unhappy path', () => {
    describe('When the JSON is malformed', () => {
      it('Should return a 400 bad request', async () => {
        // @ts-expect-error
        const resp = await handler({ body: undefined }, MOCK_CONTEXT, null);
        expect(resp).toEqual(
          expect.objectContaining({
            statusCode: 400,
            body: '{"message":"Could not parse the JSON Body"}',
          })
        );
      });
    });
    describe('When the `dateTime` is in an invalid format', () => {
      it('Should return a 400 bad request', async () => {
        const resp = await handler(
          genMockEvent({
            dateTime: 'NOT A DATE',
          }),
          MOCK_CONTEXT,
          null
        );
        // @ts-expect-error
        expect(resp.statusCode).toEqual(400);
      });
    });
    describe('When there is no member or the email is not verified', () => {
      it('Should return a 401 unauthorized with not verified email', async () => {
        const event = genMockEvent(
          {},
          {
            authorizer: {
              claims: {
                'cognito:username': 'dev-id',
                email_verified: false,
              },
            },
          }
        );
        const resp = await handler(event, MOCK_CONTEXT, null);
        // @ts-expect-error
        expect(resp.statusCode).toEqual(401);
      });
      it('Should return a 401 unauthorized with no username', async () => {
        const event = genMockEvent(
          {},
          {
            authorizer: {
              claims: {
                'cognito:username': undefined,
                email_verified: false,
              },
            },
          }
        );
        const resp = await handler(event, MOCK_CONTEXT, null);
        // @ts-expect-error
        expect(resp.statusCode).toEqual(401);
      });
    });
    describe('When there is no `title` passed in', () => {
      it('Should return a 400 bad request', async () => {
        const resp = await handler(
          genMockEvent({
            title: undefined,
          }),
          MOCK_CONTEXT,
          null
        );
        // @ts-expect-error
        expect(resp.statusCode).toEqual(400);
      });
    });
    describe('When there is no `circleId` passed in', () => {
      it('Should return a 400 bad request', async () => {
        const resp = await handler(
          genMockEvent({
            circleId: undefined,
          }),
          MOCK_CONTEXT,
          null
        );

        // @ts-expect-error
        expect(resp.statusCode).toEqual(400);
      });
    });

    describe('When fetching the Circles returns an error', () => {
      it('Should return a 500', async () => {
        const circleModelBatchGetSpy = jest.spyOn(CircleModel, 'batchGet');
        circleModelBatchGetSpy.mockImplementationOnce(() =>
          Promise.reject(false)
        );

        const resp = await handler(genMockEvent({}), MOCK_CONTEXT, null);
        expect(resp).toEqual(expect.objectContaining({ statusCode: 500 }));
      });
      it('Should log.error', async () => {
        const lambdaLogErrorSpy = jest.spyOn(log, 'error');
        const circleModelBatchGetSpy = jest.spyOn(CircleModel, 'batchGet');
        circleModelBatchGetSpy.mockImplementationOnce(() =>
          Promise.reject(false)
        );

        await handler(genMockEvent({}), MOCK_CONTEXT, null);
        expect(lambdaLogErrorSpy).toHaveBeenCalled();
      });
    });
    describe('When the user passed in all invalid `circleIds`', () => {
      it('Should return a 404', async () => {
        const circleModelBatchGetSpy = jest.spyOn(CircleModel, 'batchGet');
        circleModelBatchGetSpy.mockImplementationOnce(() =>
          Promise.resolve([])
        );

        const resp = await handler(genMockEvent({}), MOCK_CONTEXT, null);
        expect(resp).toEqual(expect.objectContaining({ statusCode: 404 }));
      });
    });
    describe('When creating the Content returns an error', () => {
      it('Should return a 500', async () => {
        const contentModelCreateSpy = jest.spyOn(ContentModel, 'create');
        contentModelCreateSpy.mockImplementationOnce(() =>
          Promise.reject(false)
        );

        const resp = await handler(genMockEvent({}), MOCK_CONTEXT, null);
        expect(resp).toEqual(expect.objectContaining({ statusCode: 500 }));
      });
      it('Should log.error', async () => {
        const contentModelCreateSpy = jest.spyOn(ContentModel, 'create');
        contentModelCreateSpy.mockImplementationOnce(() =>
          Promise.reject(false)
        );
        const lambdaLogErrorSpy = jest.spyOn(log, 'error');
        await handler(genMockEvent({}), MOCK_CONTEXT, null);
        expect(lambdaLogErrorSpy).toHaveBeenCalled();
      });
    });
    describe('When updating the Circles with the added Content returns an error', () => {
      it('Should return a 500', async () => {
        const circleModelUpdateSpy = jest.spyOn(CircleModel, 'update');
        circleModelUpdateSpy.mockImplementationOnce(() =>
          Promise.reject(false)
        );

        const resp = await handler(genMockEvent({}), MOCK_CONTEXT, null);
        expect(resp).toEqual(expect.objectContaining({ statusCode: 500 }));
      });
      it('Should log.error', async () => {
        const circleModelUpdateSpy = jest.spyOn(CircleModel, 'update');
        circleModelUpdateSpy.mockImplementationOnce(() =>
          Promise.reject(false)
        );
        const lambdaLogErrorSpy = jest.spyOn(log, 'error');
        await handler(genMockEvent({}), MOCK_CONTEXT, null);
        expect(lambdaLogErrorSpy).toHaveBeenCalled();
      });
    });
  });
});
