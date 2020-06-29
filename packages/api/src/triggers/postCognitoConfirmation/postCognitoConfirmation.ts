import { APIGatewayProxyHandler } from 'aws-lambda';
import log from 'lambda-log';

export const handler: APIGatewayProxyHandler = async (event) => {
  log.info(event);
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'hello world' }),
  };
};
