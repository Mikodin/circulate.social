import log from 'lambda-log';
import { handler } from './getPublicCircles';
import { CreateMockEvent, CreateMockContext } from '../testUtils';
import CircleModel from '../../interfaces/dynamo/circlesModel';

jest.mock('../../interfaces/dynamo/circlesModel', () => ({
  scan: jest.fn(() => ({
    all: jest.fn(() => ({
      exec: jest.fn(() =>
        Promise.resolve([
          {
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
          },
        ])
      ),
    })),
  })),
}));

const MOCK_EVENT_CONTEXT = {
  authorizer: {
    claims: {
      'cognito:username': 'dev-id',
      email_verified: true,
    },
  },
};

function genMockEvent(eventContext?: Record<string, unknown>) {
  return CreateMockEvent({
    requestContext: { ...MOCK_EVENT_CONTEXT, ...eventContext },
  });
}

const MOCK_EVENT = genMockEvent();
const MOCK_CONTEXT = CreateMockContext({});

describe('getMyCircles', () => {
  describe('Happy path', () => {
    it('Should call CircleModel.scan with the memberId in the condition', async () => {
      const circleModelScanSpy = jest.spyOn(CircleModel, 'scan');
      await handler(MOCK_EVENT, MOCK_CONTEXT, null);
      expect(circleModelScanSpy).toHaveBeenCalledWith({
        privacy: {
          eq: 'public',
        },
      });
    });
    it('Should return a 200 with the circles in the body', async () => {
      const resp = await handler(MOCK_EVENT, MOCK_CONTEXT, null);
      expect(resp).toEqual(
        expect.objectContaining({
          statusCode: 200,
          body:
            '{"message":"Success","circles":[{"content":["425293dd-ac0e-49b3-931b-8293c82c5502"],"privacy":"public","updatedAt":1592688117024,"members":["dev-id"],"createdAt":1592687256669,"description":"Test desc","id":"8c03b5c6-829a-4d91-80d9-e3c386af6839","createdBy":"dev-id","name":"Test"}]}',
        })
      );
    });
  });

  describe('Unhappy path', () => {
    describe('When CircleModel.scan throws an error', () => {
      const circleModelScanSpy = jest.spyOn(CircleModel, 'scan');
      beforeEach(() => {
        circleModelScanSpy.mockImplementationOnce(() => ({
          // @ts-expect-error
          exec: Promise.reject(false),
        }));
      });
      it('Should return a 500', async () => {
        const resp = await handler(MOCK_EVENT, MOCK_CONTEXT, null);
        expect(resp).toEqual(
          expect.objectContaining({
            statusCode: 500,
            body:
              '{"message":"Something went wrong trying to get your circles"}',
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
