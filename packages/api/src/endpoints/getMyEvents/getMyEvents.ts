import { APIGatewayProxyHandler } from 'aws-lambda';
import log from 'lambda-log';
import { getMyEvents } from '../../interfaces/dynamo/eventsTable';

import 'source-map-support/register';

export const handler: APIGatewayProxyHandler = async (event, _context) => {
  const isInLocal = process.env.IS_LOCAL === 'true' ? true : false;

  const memberId = isInLocal
    ? 'dev-id'
    : event.requestContext.authorizer.claims['cognito:username'];
  const isEmailVerified = isInLocal
    ? true
    : event.requestContext.authorizer.claims.email_verified;

  if (!isEmailVerified) {
    return {
      statusCode: 401,
      body: JSON.stringify({
        message: 'Please verify your email address',
      }),
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
    };
  }

  try {
    const events = await getMyEvents(memberId);
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Success',
        events,
      }),
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
    };
  } catch (error) {
    log.error('Failed to get my circle', {
      error,
    });
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Something went wrong trying to get your circles',
      }),
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
    };
  }
};
