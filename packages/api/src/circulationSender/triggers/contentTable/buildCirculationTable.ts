import { DynamoDBStreamHandler, DynamoDBStreamEvent } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import log from 'lambda-log';
import { v4 as uuidv4 } from 'uuid';

import { Content, Circle } from '@circulate/types';

import CircleModel from '../../../interfaces/dynamo/circlesModel';
import UpcomingCirculationModel from '../../../interfaces/dynamo/upcomingCirculationModel';

export const handler: DynamoDBStreamHandler = async (
  event: DynamoDBStreamEvent
) => {
  log.info('Incoming event', event);

  // Handle delete
  //   const deleteEvents = event.Records.filter(
  //     (record) => record.eventName === 'REMOVE'
  //   );

  // Fetch all Circles
  // Loop through Member id's and build Circulation object
  // Insert Circulation object into table
  // Done
  const insertEvents = event.Records.filter(
    (record) => record.eventName === 'INSERT'
  ).map((record) =>
    DynamoDB.Converter.unmarshall(record.dynamodb.NewImage)
  ) as Content[];

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
  } catch (error) {
    log.error('Failed to batchGet circles', circleIdsToFetch, error);
    throw error;
  }

  const circulationsAdded = await Promise.all(
    await Promise.all(
      circles.map((circle) =>
        Promise.all(
          circle.members.map(async (memberId) => {
            const urn = `${memberId}:${circle.frequency}`;
            let circulationAlreadyExists;
            try {
              circulationAlreadyExists = Boolean(
                await UpcomingCirculationModel.get(urn)
              );
            } catch (error) {
              log.error('Error fetching members upcomingCirculation', {
                memberId,
                error,
              });
            }

            if (circulationAlreadyExists) {
              return UpcomingCirculationModel.update(
                {
                  urn,
                },
                { $ADD: { circles: [circle.id] } }
              );
            }

            return UpcomingCirculationModel.create({
              urn,
              circulationId: uuidv4(),
              userId: memberId,
              circles: [circle.id],
            });
          })
        )
      )
    )
  );

  log.info('Created circulations', circulationsAdded);
};
