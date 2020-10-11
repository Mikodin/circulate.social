import { APIGatewayProxyHandler } from 'aws-lambda';
import log from 'lambda-log';

export const handler: APIGatewayProxyHandler = async (event) => {
  log.info('Incoming event', { event });
  log.warn('Warning');
  log.error('Error');

  throw new Error('Some error mofo');
};
