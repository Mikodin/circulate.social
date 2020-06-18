import { APIGatewayProxyHandler } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import log from 'lambda-log';
import { ZoneId, ZonedDateTime } from '@js-joda/core';
import '@js-joda/timezone';

import { Circle, Content } from '@circulate/types';
import ContentModel from '../../interfaces/dynamo/contentModel';
import CircleModel from '../../interfaces/dynamo/circlesModel';

import 'source-map-support/register';

export const handler: APIGatewayProxyHandler = async (event) => {
  log.info('Incoming event', { event });
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

  const {
    title,
    circleId,
    dateTime,
    description,
    link,
    privacy,
    categories,
    tags,
  } = body;

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
        // @TODO limit to only my domain
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
    };
  }

  if (!title) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'Title field is required',
      }),
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
    };
  }

  if (!circleId) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'circleId field is required',
      }),
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
    };
  }

  let dateTimeUtc;
  if (dateTime) {
    try {
      dateTimeUtc = ZonedDateTime.parse(dateTime)
        .withZoneSameInstant(ZoneId.of('UTC'))
        .toString();
    } catch (error) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: `${dateTime} could not be parsed please use a format like "2020-05-23T16:00-07:00[America/Los_Angeles]"`,
        }),
      };
    }
  }

  try {
    const circleIds = Array.isArray(circleId) ? [...circleId] : [circleId];

    const circlesToSubmitEventTo = (
      await CircleModel.batchGet(circleIds.map((id) => ({ id })))
    ).map((circleDocument) => circleDocument);

    const circlesUserIsMemberOf = circlesToSubmitEventTo
      .filter((circle) => {
        return circle.original().members.values.includes(memberId);
      })
      .map((circleDoc) => circleDoc.original()) as Circle[];

    if (!circlesUserIsMemberOf.length) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: `circleId: [${circleId}] were not found, or you are not a member of them`,
        }),
      };
    }

    const insertedContent = ((await ContentModel.create(
      {
        id: uuidv4(),
        createdBy: memberId,
        title,
        circleIds: circlesUserIsMemberOf.map((circleDoc) => circleDoc.id),
        dateTime: dateTimeUtc,
        description,
        link,
        privacy,
        categories,
        tags,
      },
      memberId
    )) as unknown) as Content;

    await Promise.all(
      circlesUserIsMemberOf.map((circle) =>
        CircleModel.update(
          { id: circle.id },
          { $ADD: { content: [insertedContent.id] } }
        )
      )
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Success',
        content: insertedContent,
      }),
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
    };
  } catch (error) {
    log.error('Failed to create content', {
      error,
    });
    if (
      error.code === 'ValidationException' ||
      error.name === 'ValidationError' ||
      error.name === 'TypeMismatch'
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: error.message,
          error,
        }),
      };
    }

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Something went wrong trying to add Content',
      }),
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
    };
  }
};
