import { APIGatewayProxyHandler } from 'aws-lambda';
import log from 'lambda-log';
import { Circle, User, CirclePreview } from '@circulate/types/index';
import { generateReturn, getMemberFromAuthorizer } from '../endpointUtils';
import CircleModel from '../../interfaces/dynamo/circlesModel';
import UserModel from '../../interfaces/dynamo/userModel';

function getUsersName(user: User) {
  if (!user) {
    return '';
  }

  return `${user.firstName || ''} ${(user.lastName || '').charAt(0)}`;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  log.info('Incoming request', { event });
  let memberId;
  if (event.requestContext.authorizer) {
    memberId = getMemberFromAuthorizer(event).memberId;
  }

  const { circleId } = event.pathParameters;

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

    const creatorUser = members.find(
      (member) => member.id === circle.createdBy
    );

    const circlePreview: CirclePreview = {
      circleId: circle.id,
      createdAt: circle.createdAt,
      updatedAt: circle.updatedAt,
      creatorName: getUsersName(creatorUser),
      memberNames: members.map((member) => getUsersName(member)),
      memberIds: members.map((member) => member.id),
      name: circle.name,
      description: circle.description,
      totalContentCount: (circle.content || []).length,
      upcomingContentCount: (circle.upcomingContentIds || []).length,
      frequency: circle.frequency,
      privacy: circle.privacy,
    };

    return generateReturn(200, {
      circlePreview,
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
