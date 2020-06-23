import { APIGatewayProxyHandler } from 'aws-lambda';
import log from 'lambda-log';
import { Circle } from '@circulate/types/index';
import CircleModel from '../../interfaces/dynamo/circlesModel';
import { generateReturn, getMemberFromAuthorizer } from '../endpointUtils';

import 'source-map-support/register';

export const handler: APIGatewayProxyHandler = async (event) => {
  const { memberId, isEmailVerified } = getMemberFromAuthorizer(event);
  const { circleId } = event.pathParameters;

  if (!isEmailVerified) {
    return generateReturn(401, {
      message: 'Please verify your email address',
    });
  }

  try {
    const updatedCircle = (
      await CircleModel.update(
        { id: circleId },
        { $ADD: { members: [memberId] } }
      )
    ).original() as Circle;
    return generateReturn(200, {
      message: 'Success',
      joined: { success: true, circleId: updatedCircle.id },
    });
  } catch (error) {
    log.error('Failed to join circle', {
      error,
    });
    return generateReturn(500, {
      message: 'Something went wrong trying to join the circle',
    });
  }
};
