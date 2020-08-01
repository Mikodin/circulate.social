import log from 'lambda-log';
import { v4 as uuidv4 } from 'uuid';
import { Circle } from '@circulate/types';

import CircleModel from '../../../interfaces/dynamo/circlesModel';
import UpcomingCirculationModel from '../../../interfaces/dynamo/upcomingCirculationModel';

export async function fetchCircles(
  circleIdsToFetch: string[]
): Promise<Circle[]> {
  let circles: Circle[];
  try {
    circles = JSON.parse(
      JSON.stringify(
        (await CircleModel.batchGet(circleIdsToFetch)).map((circle) =>
          circle.original()
        )
      )
    ) as Circle[];

    return circles;
  } catch (error) {
    log.error('Failed to batchGet circles', circleIdsToFetch, error);
    throw error;
  }
}

export async function updateOrCreateCirculation(
  memberId: string,
  circleId: string,
  frequency: string
): Promise<Document> {
  const urn = `${memberId}:${frequency}`;
  let circulation: Document;
  try {
    circulation = await UpcomingCirculationModel.create({
      urn,
      circulationId: uuidv4(),
      userId: memberId,
      frequency,
      circles: [circleId],
    });

    return circulation;
  } catch (createError) {
    // Means there is a duplicate
    if (createError.code === 'ConditionalCheckFailedException') {
      try {
        circulation = await UpcomingCirculationModel.update(
          {
            urn,
          },
          { $ADD: { circles: [circleId] } }
        );

        return circulation;
      } catch (updateError) {
        log.warn(`Failed to update circulation [${urn}]`, {
          updateError,
        });
        throw updateError;
      }
    }

    log.warn(`Failed to create circulation [${urn}`, { createError });
    throw createError;
  }
}

interface CirculationToConstruct {
  memberId: string;
  circleId: string;
  frequency: Circle['frequency'];
}
export function constructCirculationArray(
  circles: Circle[]
): CirculationToConstruct[] {
  return circles.reduce((acc, currentCircle) => {
    const membersInCircle = currentCircle.members.map((member) => ({
      memberId: member,
      circleId: currentCircle.id,
      frequency: currentCircle.frequency,
    }));

    acc.push(...membersInCircle);
    return acc;
  }, []);
}
