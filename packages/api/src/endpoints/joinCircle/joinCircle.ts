import { APIGatewayProxyHandler } from 'aws-lambda';
import log from 'lambda-log';
import { joinCircle } from '../../interfaces/dynamo/circlesTable';

import 'source-map-support/register';

export const handler: APIGatewayProxyHandler = async (event) => {
  const isInLocal = process.env.IS_LOCAL === 'true';
  const memberId = isInLocal
    ? 'dev-id'
    : event.requestContext.authorizer.claims['cognito:username'];
  const isEmailVerified = isInLocal
    ? true
    : event.requestContext.authorizer.claims.email_verified;

  const { circleId } = event.pathParameters;

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
    const joined = await joinCircle(circleId, memberId);
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Success',
        joined,
      }),
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
    };
  } catch (error) {
    log.error('Failed to join circle', {
      error,
    });
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Something went wrong trying to join the circle',
      }),
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
    };
  }
};
