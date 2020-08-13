import mailgunSetup from 'mailgun-js';
import { ScheduledHandler } from 'aws-lambda';
import log from 'lambda-log';
import { Condition } from 'dynamoose';
import { Circulation } from '@circulate/types';

import {
  constructFilledOutCirculations,
  constructCirculationComponentMaps,
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
    (await UpcomingCirculationModel.scan(dailyFilter).exec())
      // @ts-expect-error
      .map((doc) => JSON.parse(JSON.stringify(doc.original())))
  );
}

export const handler: ScheduledHandler = async () => {
  log.info('Incoming event');

  const upcomingDailyCirculations = await fetchUpcomingDailyCirculations();

  const {
    circlesMap,
    usersMap,
    contentMap,
  } = await constructCirculationComponentMaps(upcomingDailyCirculations);

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
        from: 'Test <milkman@circulate.social>',
        to: 'mfalicea58@gmail.com',
        subject: 'Your Circulation for today',
        html: circulationToSend,
      };

      return emailParams;
    }
  );

  try {
    log.info(`Sending [${fullEmailsToSend.length}] Circulations`, {
      idsToSend: Array.from(filledOutCirculationsMap.keys()),
    });
    const sentMessages = await Promise.all(
      fullEmailsToSend.map((emailParams) => {
        return mailgun.messages().send(emailParams);
      })
    );

    log.info('Sent messages', { sentMessages });
  } catch (error) {
    log.error('Failed to send messages', { error, fullEmailsToSend });
    throw error;
  }
};
