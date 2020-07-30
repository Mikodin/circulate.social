import { DynamoDBStreamHandler, DynamoDBStreamEvent } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import log from 'lambda-log';
import { v4 as uuidv4 } from 'uuid';

import { Content, Circle } from '@circulate/types';

import CircleModel from '../../../interfaces/dynamo/circlesModel';
import UpcomingCirculationModel from '../../../interfaces/dynamo/upcomingCirculationModel';

async function fetchCircles(insertEvents: Content[]): Promise<Circle[]> {
  const circleIdsToFetch = insertEvents.flatMap((content) => content.circleIds);

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

async function getIfCirculationExists(userUrn: string) {
  try {
    return Boolean(await UpcomingCirculationModel.get(userUrn));
  } catch (error) {
    log.error(`Error fetching memberId:[${userUrn}] upcomingCirculation`, {
      userUrn,
      error,
    });

    throw error;
  }
}
async function updateOrCreateCirculation(
  circulationAlreadyExists: boolean,
  urn: string,
  circleId: string,
  memberId?: string
) {
  if (circulationAlreadyExists) {
    return UpcomingCirculationModel.update(
      {
        urn,
      },
      { $ADD: { circles: [circleId] } }
    );
  }

  return UpcomingCirculationModel.create({
    urn,
    circulationId: uuidv4(),
    userId: memberId,
    circles: [circleId],
  });
}

async function updateUsersCirclulation(circles: Circle[]) {
  try {
    // Loop through Circles
    //  Loop through Members
    //    Update or create circulation
    const circulationsAdded = await Promise.all(
      circles.map(async (circle) =>
        Promise.all(
          circle.members.map(async (memberId) => {
            const urn = `${memberId}:${circle.frequency}`;
            const circulationAlreadyExists = await getIfCirculationExists(urn);

            const circulation = await updateOrCreateCirculation(
              circulationAlreadyExists,
              urn,
              circle.id,
              memberId
            );

            return circulation;
          })
        )
      )
    );
    return circulationsAdded;
  } catch (error) {
    log.error('Failed to get/update/create Circulations', { circles, error });
    throw error;
  }
}

export const handler: DynamoDBStreamHandler = async (
  event: DynamoDBStreamEvent
) => {
  log.info('Incoming event', event);

  const insertEvents = event.Records.filter(
    (record) => record.eventName === 'INSERT'
  ).map((record) =>
    DynamoDB.Converter.unmarshall(record.dynamodb.NewImage)
  ) as Content[];

  if (!insertEvents || !insertEvents.length) {
    log.info('No insert events, returning');
    return;
  }

  const circles = await fetchCircles(insertEvents);
  const circulationsUpdated = await updateUsersCirclulation(circles);

  console.log(circulationsUpdated);
  log.info('Created circulations', circulationsUpdated);
};
