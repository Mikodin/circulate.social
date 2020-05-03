import { APIGatewayProxyHandler } from 'aws-lambda';
import log from 'lambda-log';
import { getCircleById } from '../../interfaces/dynamo/circlesTable';
import { getEventById } from '../../interfaces/dynamo/eventsTable';

import 'source-map-support/register';

export const handler: APIGatewayProxyHandler = async (event, _context) => {
  const isInLocal = process.env.IS_LOCAL === 'true';

  const memberId = isInLocal
    ? 'dev-id'
    : event.requestContext.authorizer.claims['cognito:username'];
  const isEmailVerified = isInLocal
    ? true
    : event.requestContext.authorizer.claims.email_verified;

  const { eventId } = event.pathParameters;

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
    const userEvent = await getEventById(eventId);
    if (!userEvent) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: `An event with id:[${eventId}] was not found`,
        }),
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
      };
    }

    if (userEvent.circleId) {
      const circle = await getCircleById(userEvent.circleId);
      const isMemberInCircle = circle.members.includes(memberId);
      if (!isMemberInCircle) {
        return {
          statusCode: 401,
          body: JSON.stringify({
            message: 'You are not authorized to access this event',
          }),
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': true,
          },
        };
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Success',
        event: userEvent,
      }),
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
    };
  } catch (error) {
    log.error(`Failed to get Event:[${eventId}] for Member:[${memberId}]`, {
      error,
    });
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: `Something went wrong trying to get Event:[${eventId}] for Member:[${memberId}]`,
      }),
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
    };
  }
};
