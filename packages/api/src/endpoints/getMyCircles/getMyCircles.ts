import { APIGatewayProxyHandler } from 'aws-lambda';
import log from 'lambda-log';
import { getMyCircles } from '../../interfaces/dynamo/circlesTable';
import { generateReturn, getMemberFromAuthorizer } from '../endpointUtils';

export const handler: APIGatewayProxyHandler = async (event) => {
  const { memberId, isEmailVerified } = getMemberFromAuthorizer(event);

  if (!isEmailVerified) {
    return generateReturn(401, {
      message: 'Please verify your email address',
    });
  }

  try {
    const circles = await getMyCircles(memberId);
    return generateReturn(200, {
      message: 'Success',
      circles,
    });
  } catch (error) {
    log.error('Failed to get my circle', {
      error,
    });
    return generateReturn(500, {
      message: 'Something went wrong trying to get your circles',
    });
  }
};
