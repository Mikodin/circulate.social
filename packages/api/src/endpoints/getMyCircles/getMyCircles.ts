import { APIGatewayProxyHandler } from 'aws-lambda';
import log from 'lambda-log';

import { Circle } from '@circulate/types/index';
import CircleModel from '../../interfaces/dynamo/circlesModel';
import { generateReturn, getMemberFromAuthorizer } from '../endpointUtils';

export const handler: APIGatewayProxyHandler = async (event) => {
  const { memberId, isEmailVerified } = getMemberFromAuthorizer(event);

  if (!isEmailVerified) {
    return generateReturn(401, {
      message: 'Please verify your email address',
    });
  }

  try {
    // TODO make Member table.  Can query for member - then batchGet on Circles
    const myCircles = (
      await CircleModel.scan({
        members: { contains: memberId },
      })
        .all()
        .exec()
    ).map(
      (circleDocument) =>
        JSON.parse(JSON.stringify(circleDocument.original())) as Circle
    );

    return generateReturn(200, {
      message: 'Success',
      circles: myCircles,
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
