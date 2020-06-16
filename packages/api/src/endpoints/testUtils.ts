import { APIGatewayProxyEvent, Context } from 'aws-lambda';

export function CreateMockEvent(event): APIGatewayProxyEvent {
  const mockEvent = {
    requestContext: {
      authorizer: {
        clams: {
          'cognito:username': 'Dev User',
          // eslint-disable-next-line @typescript-eslint/camelcase
          email_verified: true,
        },
      },
    },
    ...event,
    body: JSON.stringify(event.body || {}),
  };

  return mockEvent;
}

export function CreateMockContext(context): Context {
  return {
    ...context,
  };
}
