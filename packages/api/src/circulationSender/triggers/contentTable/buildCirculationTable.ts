import { DynamoDBStreamHandler, DynamoDBStreamEvent } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import log from 'lambda-log';

import { Content, Circle } from '@circulate/types';

import {
  fetchCircles,
  updateOrCreateCirculation,
  constructCirculationArray,
} from './buildCirculationHelpers';

// TODO:  This NEEDS to happen when a user JOINS a Circle as well </3
async function handleUpdatingAllUsersCirculation(circles: Circle[]) {
  const circulationsToMake = constructCirculationArray(circles);

  const circulationsAdded = await Promise.all(
    circulationsToMake.map(({ memberId, circleId, frequency }) =>
      updateOrCreateCirculation(memberId, circleId, frequency)
    )
  );

  return circulationsAdded;
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

  const circleIdsToFetch = insertEvents.flatMap((content) => content.circleIds);

  let circles;
  try {
    circles = await fetchCircles(circleIdsToFetch);
  } catch (error) {
    log.error('Failed to fetch circles', { insertEvents, error });
    throw error;
  }

  try {
    const circulationsUpdated = await handleUpdatingAllUsersCirculation(
      circles
    );
    log.info('Updated circulations', circulationsUpdated);
  } catch (error) {
    log.error('Failed to update users in Circles circulation', {
      circles,
      error,
    });

    throw error;
  }
};
