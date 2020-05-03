import { APIGatewayProxyHandler } from 'aws-lambda';
import log from 'lambda-log';
import { getCircleById } from '../../interfaces/dynamo/circlesTable';
import { getUpcomingCircleEvents } from '../../interfaces/dynamo/eventsTable';

import 'source-map-support/register';

export const handler: APIGatewayProxyHandler = async (event, _context) => {
  const isInLocal = process.env.IS_LOCAL === 'true';

  const memberId = isInLocal
    ? 'dev-id'
    : event.requestContext.authorizer.claims['cognito:username'];
  const isEmailVerified = isInLocal
    ? true
    : event.requestContext.authorizer.claims.email_verified;

  const { circleId } = event.pathParameters;
  const getUpcomingEvents =
    event.queryStringParameters &&
    event.queryStringParameters.getUpcomingEvents;

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
    const circle = await getCircleById(circleId);
    if (!circle) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: `A Circle with id:[${circleId}] was not found`,
        }),
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
      };
    }

    const isMemberInCircle = circle.members.includes(memberId);

    if (!isMemberInCircle) {
      return {
        statusCode: 401,
        body: JSON.stringify({
          message: 'You are not authorized to access this circle',
        }),
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
      };
    }

    if (getUpcomingEvents) {
      const upcomingCircleEvents = await getUpcomingCircleEvents(circleId);
      circle.upcomingEventDetails = upcomingCircleEvents;
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Success',
        circle,
      }),
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
    };
  } catch (error) {
    log.error(`Failed to get Circle:[${circleId}] for Member:[${memberId}]`, {
      error,
    });
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: `Something went wrong trying to get Circle:[${circleId}] for Member:[${memberId}]`,
      }),
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
    };
  }
};
