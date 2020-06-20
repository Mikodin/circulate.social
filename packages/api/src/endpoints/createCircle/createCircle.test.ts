import { APIGatewayProxyResult } from 'aws-lambda';
import { CreateMockEvent, CreateMockContext } from '../testUtils';
import { handler } from './createCircle';
import CirclesModel from '../../interfaces/dynamo/circlesModel';

jest.mock('../../interfaces/dynamo/circlesModel', () => ({
  create: jest.fn(() => true),
}));

const MOCK_EVENT = CreateMockEvent({
  body: {
    name: 'The greatest Circle ever',
    description: 'An enticing description',
    frequency: 'daily',
    privacy: 'private',
  },
  requestContext: {
    authorizer: {
      claims: {
        'cognito:username': 'Dev User',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        email_verified: true,
      },
    },
  },
});

const MOCK_CONTEXT = CreateMockContext({});

describe('createCircle', () => {
  describe('Happy path', () => {
    it('Should call CircleModel.create with the body', async () => {
      const createSpy = jest.spyOn(CirclesModel, 'create');
      await handler(MOCK_EVENT, MOCK_CONTEXT, null);
      expect(createSpy).toHaveBeenCalledWith({
        createdBy: 'Dev User',
        description: 'An enticing description',
        frequency: 'daily',
        id: expect.any(String),
        members: ['Dev User'],
        name: 'The greatest Circle ever',
        privacy: 'private',
      });
    });

    it('Should return a 200', async () => {
      const handlerResp = await handler(MOCK_EVENT, MOCK_CONTEXT, null);
      expect(handlerResp).toEqual({
        statusCode: 200,
        body: '{"message":"Success","circle":true}',
        headers: {
          'Access-Control-Allow-Credentials': true,
          'Access-Control-Allow-Origin': '*',
        },
      });
    });
  });
  describe('Error codes to return', () => {
    it('Should return a 401 when the user is not logged in or if their email is not verified', async () => {
      const NOT_LOGGED_IN_EVENT = CreateMockEvent({
        ...MOCK_EVENT,
        requestContext: {
          authorizer: {
            claims: {
              'cognito:username': undefined,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              email_verified: undefined,
            },
          },
        },
      });
      const handlerResp = (await handler(
        NOT_LOGGED_IN_EVENT,
        MOCK_CONTEXT,
        null
      )) as APIGatewayProxyResult;

      expect(handlerResp.statusCode).toEqual(401);
      expect(handlerResp.body).toEqual(
        '{"message":"Please verify your email address or login"}'
      );
    });
    it('Should return a 400 if the event.body does not have a name', async () => {
      const NO_NAME_EVENT = CreateMockEvent({
        ...MOCK_EVENT,
        body: {
          name: undefined,
        },
      });
      const handlerResp = (await handler(
        NO_NAME_EVENT,
        MOCK_CONTEXT,
        null
      )) as APIGatewayProxyResult;

      expect(handlerResp.statusCode).toEqual(400);
      expect(handlerResp.body).toEqual('{"message":"Name field is required"}');
    });
  });
});
