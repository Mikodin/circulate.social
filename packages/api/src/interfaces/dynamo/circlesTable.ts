import { DynamoDB } from 'aws-sdk';
import log from 'lambda-log';
import { v4 as uuidv4 } from 'uuid';
import { ZonedDateTime, ZoneOffset } from '@js-joda/core';

const defaultDynamoClient = new DynamoDB.DocumentClient();

export interface Circle {
  circleId: string;
  createdAt: string;
  updatedAt: string;
  members: string[];
  creatorId: string;
  name: string;
  description: string;
  events: object[];
}

type PartialCircle = Omit<
  Circle,
  'circleId' | 'createdAt' | 'updatedAt' | 'members' | 'creatorId' | 'events'
>;

const CIRCLES_TABLE_NAME = process.env.CIRCLES_TABLE_NAME;

export async function insertCircle(
  circleInfo: PartialCircle,
  creatorId: string,
  tableName: string = CIRCLES_TABLE_NAME,
  dynamoClient: DynamoDB.DocumentClient = defaultDynamoClient
) {
  const timestamp = ZonedDateTime.now(ZoneOffset.UTC).toString();

  const params = {
    TableName: tableName,
    Item: {
      ...circleInfo,
      id: uuidv4(),
      creatorId,
      members: [creatorId],
      events: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  };

  try {
    log.info(`Inserting Circle into ${tableName}!`, {
      params,
    });
    await dynamoClient.put(params).promise();

    return params.Item;
  } catch (error) {
    log.info('Failed to insert into the Circle table', {
      method: 'interfaces/dynamo/circlesTable.insertCircle',
      params,
      error,
    });

    throw error;
  }
}

export async function joinCircle(
  circleId: string,
  memberId: string,
  tableName: string = CIRCLES_TABLE_NAME,
  dynamoClient: DynamoDB.DocumentClient = defaultDynamoClient
) {
  const timestamp = ZonedDateTime.now(ZoneOffset.UTC).toString();

  const params = {
    TableName: tableName,
    Key: { id: circleId },
    UpdateExpression:
      'SET members = list_append(members, :memberId), updatedAt=:timestamp',
    ConditionExpression: 'not contains (members, :memberIdSingle)',
    ExpressionAttributeValues: {
      ':memberId': [memberId],
      ':timestamp': timestamp,
      ':memberIdSingle': memberId,
    },
  };

  try {
    log.info(
      `Member: ${memberId} joining Circle: ${circleId} in Table:${tableName}!`,
      {
        params,
      }
    );

    await dynamoClient.update(params).promise();

    return { memberJoinedCircle: true, memberAlreadyInCirlce: false };
  } catch (error) {
    log.info('Failed to join the Circle', {
      method: 'interfaces/dynamo/circlesTable.joinCircle',
      params,
      error,
    });

    if (error.code === 'ConditionalCheckFailedException') {
      return { memberJoinedCircle: false, memberAlreadyInCirlce: true };
    }

    throw error;
  }
}

export async function getCircle(
  circleId: string,
  tableName: string = CIRCLES_TABLE_NAME,
  dynamoClient: DynamoDB.DocumentClient = defaultDynamoClient
) {
  const params = {
    TableName: tableName,
    Key: {
      id: circleId,
    },
  };

  try {
    log.info(`Fetching Circle:${circleId}`, {
      params,
    });
    const { Item } = await dynamoClient.get(params).promise();

    return Item;
  } catch (error) {
    log.info('Failed to get the Circle', {
      method: 'interfaces/dynamo/circlesTable.getCircle',
      params,
      error,
    });

    throw error;
  }
}

export async function addEventToCircle(
  circleId: string,
  eventId: string,
  tableName: string = CIRCLES_TABLE_NAME,
  dynamoClient: DynamoDB.DocumentClient = defaultDynamoClient
) {
  const timestamp = ZonedDateTime.now(ZoneOffset.UTC).toString();

  const params = {
    TableName: tableName,
    Key: { id: circleId },
    UpdateExpression:
      'SET events = list_append(events, :eventId), updatedAt=:timestamp',
    ConditionExpression: 'not contains (events, :eventId)',
    ExpressionAttributeValues: {
      ':eventId': [eventId],
      ':timestamp': timestamp,
    },
  };

  try {
    log.info(
      `Adding Event: ${eventId} to Circle: ${circleId} in Table:${tableName}!`,
      {
        params,
      }
    );

    const inserted = await dynamoClient.update(params).promise();

    return inserted;
  } catch (error) {
    log.info('Failed to add event to the Circle', {
      method: 'interfaces/dynamo/circlesTable.joinCircle',
      params,
      error,
    });

    throw error;
  }
}

export async function getMyCircles(
  memberId: string,
  tableName: string = CIRCLES_TABLE_NAME,
  dynamoClient: DynamoDB.DocumentClient = defaultDynamoClient
) {
  const params = {
    TableName: tableName,
    FilterExpression: 'contains (members, :memberId)',
    ExpressionAttributeValues: { ':memberId': memberId },
  };

  try {
    log.info(
      `Fetching Circles for Member:[${memberId}] from Table:[${tableName}]`,
      {
        params,
      }
    );

    const myCircles = await dynamoClient.scan(params).promise();

    return myCircles.Items;
  } catch (error) {
    log.info('Failed to get my circles', {
      method: 'interfaces/dynamo/circlesTable.getMyCircles',
      params,
      error,
    });

    throw error;
  }
}

export async function getCircleById(
  circleId: string,
  tableName: string = CIRCLES_TABLE_NAME,
  dynamoClient: DynamoDB.DocumentClient = defaultDynamoClient
) {
  const params = {
    TableName: tableName,
    Key: {
      id: circleId,
    },
  };

  try {
    log.info(`Fetching Circle:[${circleId}] from Table:[${tableName}]`, {
      params,
    });

    const circle = await dynamoClient.get(params).promise();

    return circle.Item;
  } catch (error) {
    log.info('Failed to get circle', {
      method: 'interfaces/dynamo/circlesTable.getCircleById',
      params,
      error,
    });

    throw error;
  }
}
