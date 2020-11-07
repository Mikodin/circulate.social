import { APIGatewayProxyHandler } from 'aws-lambda';
import log from 'lambda-log';

import { Circle } from '@circulate/types/index';
import CircleModel from '../../interfaces/dynamo/circlesModel';
import { generateReturn } from '../endpointUtils';

export const handler: APIGatewayProxyHandler = async (event) => {
  log.info('Incoming request', { event });
  try {
    // TODO paginate these results
    const publicCircles = (
      await CircleModel.scan({
        privacy: { eq: 'public' },
      })
        .all()
        .exec()
    ).map(
      (circleDocument) =>
        JSON.parse(JSON.stringify(circleDocument.original())) as Circle
    );

    return generateReturn(200, {
      message: 'Success',
      circles: publicCircles,
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
