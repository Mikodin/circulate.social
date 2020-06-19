import { APIGatewayProxyEvent } from 'aws-lambda';
import { Circle } from '@circulate/types';
import CircleModel from '../../interfaces/dynamo/circlesModel';

interface returnObject {
  statusCode: number;
  body: string;
  headers: {
    'Access-Control-Allow-Origin': '*';
    'Access-Control-Allow-Credentials': boolean;
  };
}
export function generateReturn(
  statusCode: number,
  body: Record<string, unknown>
): returnObject {
  return {
    statusCode,
    body: JSON.stringify(body),
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
  };
}

export function getMemberFromAuthorizer(
  event: APIGatewayProxyEvent
): { memberId: string; isEmailVerified: boolean } {
  const isInLocal = process.env.IS_LOCAL === 'true';
  const memberId = isInLocal
    ? 'dev-id'
    : event.requestContext.authorizer.claims['cognito:username'];
  const isEmailVerified = isInLocal
    ? true
    : event.requestContext.authorizer.claims.email_verified;

  return { memberId, isEmailVerified };
}

interface requiredFields {
  isEmailVerified: boolean;
  memberId: string;
  title: string;
  circleId: string;
}
export function checkRequiredFields(
  fields: requiredFields
): undefined | { statusCode: number; body: Record<string, unknown> } {
  const { isEmailVerified, memberId, title, circleId } = fields;
  if (!isEmailVerified || !memberId) {
    return {
      statusCode: 401,
      body: { message: 'Please verify your email address or login' },
    };
  }

  if (!title) {
    return {
      statusCode: 400,
      body: {
        message: 'Title field is required',
      },
    };
  }

  if (!circleId) {
    return {
      statusCode: 400,
      body: {
        message: 'circleId field is required',
      },
    };
  }

  return undefined;
}

export async function fetchCirclesMemberIsIn(
  memberId: string,
  circleId: string | string[]
): Promise<Circle[]> {
  const circleIds = Array.isArray(circleId) ? [...circleId] : [circleId];

  const circlesToSubmitEventTo = (
    await CircleModel.batchGet(circleIds.map((id) => ({ id })))
  ).map((circleDocument) => circleDocument);

  const circlesUserIsMemberOf = circlesToSubmitEventTo
    .filter((circle) => {
      return circle.original().members.values.includes(memberId);
    })
    .map((circleDoc) => circleDoc.original()) as Circle[];

  return circlesUserIsMemberOf;
}
