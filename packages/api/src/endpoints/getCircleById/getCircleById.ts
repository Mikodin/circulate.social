import { APIGatewayProxyHandler } from 'aws-lambda';
import log from 'lambda-log';
import { Circle, Content, User } from '@circulate/types/index';
import { generateReturn, getMemberFromAuthorizer } from '../endpointUtils';
import CircleModel from '../../interfaces/dynamo/circlesModel';
import ContentModel from '../../interfaces/dynamo/contentModel';
import UserModel from '../../interfaces/dynamo/userModel';

export const handler: APIGatewayProxyHandler = async (event) => {
  const { memberId, isEmailVerified } = getMemberFromAuthorizer(event);

  const { circleId } = event.pathParameters;
  const getContentDetails =
    event.queryStringParameters &&
    event.queryStringParameters.getContentDetails;

  if (!isEmailVerified) {
    return generateReturn(401, {
      message: 'Please verify your email address',
    });
  }

  try {
    const circleDbModel = await CircleModel.get(circleId);
    if (!circleDbModel) {
      return generateReturn(404, {
        message: `A Circle with id:[${circleId}] was not found`,
      });
    }
    // Converts sets and arrays to normal []
    const circle = JSON.parse(
      JSON.stringify(circleDbModel.original())
    ) as Circle;

    const members = JSON.parse(
      JSON.stringify(await UserModel.batchGet(circle.members))
    ) as User[];

    const isMemberInCircle = circle.members.includes(memberId);
    if (!isMemberInCircle) {
      return generateReturn(401, {
        message: 'You are not authorized to access this circle',
      });
    }

    if (getContentDetails && circle.content.length) {
      const contentDetails = JSON.parse(
        JSON.stringify(await ContentModel.batchGet(circle.content))
      ) as Content[];
      circle.contentDetails = contentDetails;
    }

    return generateReturn(200, {
      circle: {
        ...circle,
        members: members.map(
          (member) => `${member.firstName} ${member.lastName}`
        ),
      },
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
