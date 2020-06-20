import { Circle } from '@circulate/types';
import CircleModel from '../../interfaces/dynamo/circlesModel';

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

  const circlesToFetch = circleIds.map((id) => ({ id }));
  const circlesToSubmitEventTo = (
    await CircleModel.batchGet(circlesToFetch)
  ).map((circleDocument) =>
    // Handles Dyanmo sets and arrays equally
    JSON.parse(JSON.stringify(circleDocument.original() || {}))
  ) as Circle[];

  const circlesUserIsMemberOf = circlesToSubmitEventTo.filter((circle) => {
    return circle.members.includes(memberId);
  });

  return circlesUserIsMemberOf;
}
