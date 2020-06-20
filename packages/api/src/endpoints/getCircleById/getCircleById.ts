import { APIGatewayProxyHandler } from 'aws-lambda';
import log from 'lambda-log';
import { generateReturn, getMemberFromAuthorizer } from '../endpointUtils';
import CircleModel from '../../interfaces/dynamo/circlesModel';
import ContentModel from '../../interfaces/dynamo/contentModel';

export const handler: APIGatewayProxyHandler = async (event) => {
  const { memberId, isEmailVerified } = getMemberFromAuthorizer(event);

  const { circleId } = event.pathParameters;
  const getUpcomingEvents =
    event.queryStringParameters &&
    event.queryStringParameters.getUpcomingEvents;

  if (!isEmailVerified) {
    return generateReturn(401, {
      message: 'Please verify your email address',
    });
  }

  try {
    const circle = (await CircleModel.get(circleId)).original();
    if (!circle) {
      return generateReturn(404, {
        message: `A Circle with id:[${circleId}] was not found`,
      });
    }

    const isMemberInCircle = circle.members.values.includes(memberId);
    console.log(isMemberInCircle);

    if (!isMemberInCircle) {
      return generateReturn(401, {
        message: 'You are not authorized to access this circle',
      });
    }

    if (getUpcomingEvents && circle.content) {
      const upcomingCircleEvents = await ContentModel.batchGet(circle.content);
      circle.upcomingEventDetails = upcomingCircleEvents;
    }

    return generateReturn(200, {
      message: 'Success',
      circle,
    });
  } catch (error) {
    log.error(`Failed to get Circle:[${circleId}] for Member:[${memberId}]`, {
      error,
    });
    return generateReturn(500, {
      message: `Something went wrong trying to get Circle:[${circleId}] for Member:[${memberId}]`,
    });
  }
};
