import { APIGatewayProxyHandler } from 'aws-lambda';
import log from 'lambda-log';
import 'source-map-support/register';
import { v4 as uuidv4 } from 'uuid';
import { Circle } from '@circulate/types/index';

import CircleModel from '../../interfaces/dynamo/circlesModel';

export const handler: APIGatewayProxyHandler = async (event) => {
  log.info('Incoming Event', { event });

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (error) {
    log.error('Failed to parse JSON', { error, body: event.body });
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'Could not parse the JSON Body',
        body: event.body,
      }),
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
    };
  }
  const { name, description, frequency, privacy } = body || {};

  const isInLocal = process.env.IS_LOCAL === 'true';
  const memberId = isInLocal
    ? 'dev-id'
    : event.requestContext.authorizer.claims['cognito:username'];
  const isEmailVerified = isInLocal
    ? true
    : event.requestContext.authorizer.claims.email_verified;

  if (!isEmailVerified || !memberId) {
    return {
      statusCode: 401,
      body: JSON.stringify({
        message: 'Please verify your email address or login',
      }),
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
    };
  }

  if (!name) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'Name field is required',
      }),
      headers: {
        // @TODO limit to only my domain
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
    };
  }

  try {
    const insertedCircle = ((await CircleModel.create({
      id: uuidv4(),
      createdBy: memberId,
      members: [memberId],
      events: [],
      name,
      description,
      frequency,
      privacy,
    })) as unknown) as Circle;
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
        error,
      }),
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
    };
  }
};
