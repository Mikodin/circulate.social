import { DynamoDBStreamHandler } from 'aws-lambda';
import log from 'lambda-log';

export const handler: DynamoDBStreamHandler = async (event) => {
  log.info('Incoming event', event);
  log.info('Incoming records', event.Records);

  // Fetch all Circles
  // Loop through Member id's and build Circulation object
  // Insert Circulation object into table
  // Done
  const insertEvents = event.Records.filter(
    (record) => record.eventName === 'INSERT'
  );

  // Handle delete
  const deleteEvents = event.Records.filter(
    (record) => record.eventName === 'REMOVE'
  );

  log.info('insertEvents', insertEvents);
  log.info('deleteEvents', deleteEvents);
};
