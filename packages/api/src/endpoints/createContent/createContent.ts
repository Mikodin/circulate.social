import { APIGatewayProxyHandler } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import log from 'lambda-log';
import { ZoneId, ZonedDateTime } from '@js-joda/core';
import '@js-joda/timezone';

import { Content } from '@circulate/types';
import ContentModel from '../../interfaces/dynamo/contentModel';
import CircleModel from '../../interfaces/dynamo/circlesModel';

import {
  generateReturn,
  checkRequiredFields,
  getMemberFromAuthorizer,
  fetchCirclesMemberIsIn,
} from './createContentHelpers';

export const handler: APIGatewayProxyHandler = async (event) => {
  log.info('Incoming event', { event });

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (error) {
    log.error('Failed to parse JSON', { error, body: event.body });
    return generateReturn(400, {
      message: 'Could not parse the JSON Body',
      body: event.body,
    });
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

  const { memberId, isEmailVerified } = getMemberFromAuthorizer(event);

  const requiredFieldsError = checkRequiredFields({
    isEmailVerified,
    memberId,
    title,
    circleId,
  });
  if (requiredFieldsError) {
    return generateReturn(
      requiredFieldsError.statusCode,
      requiredFieldsError.body
    );
  }

  let dateTimeUtc;
  if (dateTime) {
    try {
      dateTimeUtc = ZonedDateTime.parse(dateTime)
        .withZoneSameInstant(ZoneId.of('UTC'))
        .toString();
    } catch (error) {
      return generateReturn(400, {
        message: `${dateTime} could not be parsed please use a format like "2020-05-23T16:00-07:00[America/Los_Angeles]"`,
      });
    }
  }

  try {
    const circlesUserIsMemberOf = await fetchCirclesMemberIsIn(
      memberId,
      circleId
    );

    if (!circlesUserIsMemberOf.length) {
      return generateReturn(404, {
        message: `circleId: [${circleId}] were not found, or you are not a member of them`,
      });
    }

    const insertedContent = ((await ContentModel.create({
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
    })) as unknown) as Content;

    await Promise.all(
      circlesUserIsMemberOf.map((circle) =>
        CircleModel.update(
          { id: circle.id },
          { $ADD: { content: [insertedContent.id] } }
        )
      )
    );

    return generateReturn(200, {
      message: 'Success',
      content: insertedContent,
    });
  } catch (error) {
    log.error('Failed to create content', {
      error,
    });
    if (
      error.code === 'ValidationException' ||
      error.name === 'ValidationError' ||
      error.name === 'TypeMismatch'
    ) {
      return generateReturn(400, {
        message: error.message,
        error,
      });
    }

    return generateReturn(500, {
      message: 'Something went wrong trying to add Content',
    });
  }
};
