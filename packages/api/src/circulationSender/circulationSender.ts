import mailgunSetup from 'mailgun-js';
import { ScheduledHandler } from 'aws-lambda';
import log from 'lambda-log';
import { Condition } from 'dynamoose';
import { Circulation } from '@circulate/types';

import {
  constructFilledOutCirculations,
  constructCirculationComponentMaps,
  clearUpcomingContentFromCircles,
} from './circulationDataConstructors.helper';
import { createCirculationHtmlForUser } from './circulationHtmlConstructor.helper';
import UpcomingCirculationModel from '../interfaces/dynamo/upcomingCirculationModel';

const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY || 'test';
const MAILGUN_DOMAIN = 'mg.circulate.social';
const mailgun = mailgunSetup({
  apiKey: MAILGUN_API_KEY,
  domain: MAILGUN_DOMAIN,
});

async function fetchUpcomingDailyCirculations(): Promise<Circulation[]> {
  const dailyFilter = new Condition('frequency').contains('');
  return (
    await UpcomingCirculationModel.scan(dailyFilter).all().exec()
  ).map((doc) => JSON.parse(JSON.stringify(doc.original())));
}

export const handler: ScheduledHandler = async () => {
  log.info('Incoming event');

  const upcomingDailyCirculations = await fetchUpcomingDailyCirculations();
  if (!upcomingDailyCirculations || !upcomingDailyCirculations.length) {
    log.info('No Circulations in the table, returning');
    return;
  }

  const {
    circlesMap,
    usersMap,
    contentMap,
  } = await constructCirculationComponentMaps(upcomingDailyCirculations);

  if (!circlesMap.size || !usersMap.size || !contentMap.size) {
    log.info('No data to send, returning');
    return;
  }

  const filledOutCirculationsMap = constructFilledOutCirculations(
    upcomingDailyCirculations,
    circlesMap,
    contentMap,
    usersMap
  );

  const fullEmailsToSend = Array.from(filledOutCirculationsMap).map(
    // eslint-disable-next-line
    ([_, value]) => {
      const usersFirstName = usersMap.get(value.userId).firstName;

      const circulationToSend = createCirculationHtmlForUser(
        usersFirstName,
        value
      );

      const emailParams = {
        from: 'Circulator <milkman@circulate.social>',
        to: 'mfalicea58@gmail.com',
        subject: `${usersFirstName}, your Circulation for today`,
        html: circulationToSend,
      };

      return emailParams;
    }
  );

  try {
    log.info(`Sending [${fullEmailsToSend.length}] Circulations`, {
      idsToSend: Array.from(filledOutCirculationsMap.keys()),
    });
    const sentEmails = await Promise.all(
      fullEmailsToSend.map((emailParams) => {
        return mailgun.messages().send(emailParams);
      })
    );

    log.info(`Sent [${sentEmails.length}] Circulations`, { sentEmails });
  } catch (error) {
    log.error('Failed to send messages', { error, fullEmailsToSend });
    throw error;
  }

  const allCircleIds = Array.from(circlesMap).map(([key]) => key);
  try {
    log.info(`Clearing out [${allCircleIds.length}] circles upcoming content`);
    await clearUpcomingContentFromCircles(allCircleIds);
  } catch (error) {
    log.error('Failed to clear upcoming content from Circles', {
      allCircleIds,
      error,
    });
    throw error;
  }
};
