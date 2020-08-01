// Run once a day
// Query whole table
// Filter for daily circulations
// batchGet all circles
// batchGet all content
//  batchGet all users in Circle, similar logic as getCircleById
// Construct email
import { ScheduledEvent, ScheduledHandler } from 'aws-lambda';
import log from 'lambda-log';

export const handler: ScheduledHandler = async (event: ScheduledEvent) => {
  log.info('Incoming event', event);
};
