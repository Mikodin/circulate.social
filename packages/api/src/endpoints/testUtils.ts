import { APIGatewayProxyEvent, Context } from 'aws-lambda';

// eslint-disable-next-line
export function CreateMockEvent(event): APIGatewayProxyEvent {
  const mockEvent = {
    requestContext: {
      authorizer: {
        clams: {
          'cognito:username': 'Dev User',
          email_verified: true,
        },
      },
    },
    ...event,
    body: JSON.stringify(event.body || {}),
  };

  return mockEvent;
}

// eslint-disable-next-line
export function CreateMockContext(context): Context {
  return {
    ...context,
  };
}
