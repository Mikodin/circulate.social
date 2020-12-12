// eslint-disable-next-line
import { DynamoDB } from 'aws-sdk';
import log from 'lambda-log';
import { v4 as uuidv4 } from 'uuid';
import { ZonedDateTime, ZoneOffset } from '@js-joda/core';
import { Event } from '@circulate/types';

import { addEventToCircle } from './circlesTable';

const defaultDynamoClient = new DynamoDB.DocumentClient();

type PartialEvent = Omit<
  Event,
  'id' | 'createdAt' | 'updatedAt' | 'members' | 'creatorId'
>;

const { EVENTS_TABLE_NAME } = process.env;

export async function insertEvent(
  eventInfo: PartialEvent,
  creatorId: string,
  tableName: string = EVENTS_TABLE_NAME,
  dynamoClient: DynamoDB.DocumentClient = defaultDynamoClient
): Promise<Event> {
  const timestamp = ZonedDateTime.now(ZoneOffset.UTC).toString();

  const params = {
    TableName: tableName,
    Item: {
      ...eventInfo,
      id: uuidv4(),
      creatorId,
      members: [creatorId],
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  };

  try {
    log.info(`Inserting Event into ${tableName}!`, {
      params,
    });

    await dynamoClient.put(params).promise();

    if (eventInfo.circleId) {
      const { circleId } = eventInfo;
      const eventId = params.Item.id;
      await addEventToCircle(circleId, eventId);
    }

    return params.Item;
  } catch (error) {
    log.info('Failed to insert into the Event table', {
      method: 'interfaces/dynamo/eventsTable.insertEvent',
      params,
      error,
    });

    throw error;
  }
}

export async function getEventById(
  eventId: string,
  tableName: string = EVENTS_TABLE_NAME,
  dynamoClient: DynamoDB.DocumentClient = defaultDynamoClient
): Promise<Event> {
  const params = {
    TableName: tableName,
    Key: {
      id: eventId,
    },
  };

  try {
    log.info(`Fetching Event:${eventId}`, {
      params,
    });
    const { Item } = await dynamoClient.get(params).promise();

    return Item as Event;
  } catch (error) {
    log.info(`Failed to get the Event:[${eventId}]`, {
      method: 'interfaces/dynamo/eventsTable.getEvent',
      params,
      error,
    });

    throw error;
  }
}

export async function getMyEvents(
  memberId: string,
  tableName: string = EVENTS_TABLE_NAME,
  dynamoClient: DynamoDB.DocumentClient = defaultDynamoClient
): Promise<Event[]> {
  const params = {
    TableName: tableName,
    FilterExpression: 'contains (members, :memberId)',
    ExpressionAttributeValues: { ':memberId': memberId },
  };

  try {
    log.info(
      `Fetching Events for Member:[${memberId}] from Table:[${tableName}]`,
      {
        params,
      }
    );

    const myEvents = await dynamoClient.scan(params).promise();

    return myEvents.Items as Event[];
  } catch (error) {
    log.info('Failed to get my circles', {
      method: 'interfaces/dynamo/circlesTable.getMyCircles',
      params,
      error,
    });

    throw error;
  }
}

export async function getUpcomingCircleEvents(
  circleId: string,
  tableName: string = EVENTS_TABLE_NAME,
  dynamoClient: DynamoDB.DocumentClient = defaultDynamoClient
): Promise<Event[]> {
  const params = {
    TableName: tableName,
    FilterExpression: 'circleId = :circleId',
    ExpressionAttributeValues: { ':circleId': circleId },
  };

  try {
    log.info(
      `Fetching Events for Circle:[${circleId}] from Table:[${tableName}]`,
      {
        params,
      }
    );

    const upcomingEvents = await dynamoClient.scan(params).promise();

    return upcomingEvents.Items as Event[];
  } catch (error) {
    log.info(`Failed to get Events for Circles:${circleId}`, {
      method: 'interfaces/dynamo/circlesTable.getUpcomingCircleEvents',
      params,
      error,
    });

    throw error;
  }
}
