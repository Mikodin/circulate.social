import { APIGatewayProxyHandler } from 'aws-lambda';
import log from 'lambda-log';
import { insertCircle } from '../../interfaces/dynamo/circlesTable';

import 'source-map-support/register';

export const handler: APIGatewayProxyHandler = async (event, _context) => {
  const body = JSON.parse(event.body);
  const { name, description } = body;

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

  if (!name || !description) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'Name and description fields are required',
      }),
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
    };
  }

  try {
    const insertedCircle = await insertCircle({ name, description }, memberId);
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Success',
        circle: insertedCircle,
      }),
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
    };
  } catch (error) {
    log.error('Failed to create circle', {
      error,
    });
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Something went wrong trying to create the circle',
      }),
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
    };
  }
};
