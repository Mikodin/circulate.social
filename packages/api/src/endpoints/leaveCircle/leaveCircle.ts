import { APIGatewayProxyHandler } from 'aws-lambda';
import log from 'lambda-log';

import { Circle } from '@circulate/types';
import CircleModel from '../../interfaces/dynamo/circlesModel';
import { generateReturn, getMemberFromAuthorizer } from '../endpointUtils';

export const handler: APIGatewayProxyHandler = async (event) => {
  const { memberId, isEmailVerified } = getMemberFromAuthorizer(event);
  const { circleId } = event.pathParameters;

  if (!isEmailVerified) {
    return generateReturn(401, {
      message: 'Please verify your email address',
    });
  }

  try {
    // This is REALLY shitty. https://github.com/dynamoose/dynamoose/issues/398
    const circle = (await CircleModel.get(circleId)).original() as Circle;
    const isUserInCircle = circle.members.includes(memberId);

    if (!isUserInCircle) {
      return generateReturn(400, {
        message: 'Sorry, you are not a member of this circle',
        left: { success: false, circleId },
      });
    }

    const updatedMembers = circle.members.filter(
      (member) => member !== memberId
    );

    const updatedCircle = (
      await CircleModel.update(
        { id: circleId },
        { $SET: { members: [...updatedMembers] } }
      )
    ).original() as Circle;

    return generateReturn(200, {
      message: 'Successfully left the Circle',
      left: { success: true, circleId: updatedCircle.id },
    });
  } catch (error) {
    log.error('Failed to leave circle', {
      error,
    });
    return generateReturn(500, {
      message: 'Something went wrong trying to leave the circle',
    });
  }
};
