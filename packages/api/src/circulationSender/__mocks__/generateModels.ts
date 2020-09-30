import { Circulation } from '@circulate/types';

export function generateUpcomingCirculation(
  overrideValues?: Circulation
): Circulation {
  const { urn, circulationId, userId, circles, circleDetails, frequency } =
    overrideValues || {};
  return {
    urn: urn || `some-user-id-${Math.random()}:frequency`,
    circulationId: circulationId || `${Math.random()}-abc`,
    userId: userId || `user-id-abc-123-${Math.random()}`,
    circles: circles || [`some-circle-id-${Math.random()}`],
    circleDetails: circleDetails || undefined,
    frequency: frequency || 'daily',
  };
}
