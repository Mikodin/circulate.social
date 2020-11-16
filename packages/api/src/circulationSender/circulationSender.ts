import mailgunSetup from 'mailgun-js';
import { ScheduledHandler } from 'aws-lambda';
import log from 'lambda-log';

import {
  calculateFrequenciesToFetch,
  fetchUpcomingCirculations,
  createOneCirculationPerUser,
  constructCirculationComponentMaps,
  constructFilledOutCirculations,
  cleanup,
} from './circulationSender.helper';
import { createCirculationHtmlForUser } from './circulationHtmlConstructor.helper';

const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY || 'test';
const MAILGUN_DOMAIN = 'mg.circulate.social';
const mailgun = mailgunSetup({
  apiKey: MAILGUN_API_KEY,
  domain: MAILGUN_DOMAIN,
});

export const handler: ScheduledHandler = async () => {
  log.info('Incoming event');

  const allUpcomingCirculations = await fetchUpcomingCirculations(
    calculateFrequenciesToFetch()
  );

  if (!allUpcomingCirculations || !allUpcomingCirculations.length) {
    log.info('No Circulations in the table, returning');
    return;
  }

  const upcomingCirculations = createOneCirculationPerUser(
    allUpcomingCirculations
  );

  const {
    circlesMap,
    usersMap,
    contentMap,
  } = await constructCirculationComponentMaps(upcomingCirculations);

  if (!circlesMap.size || !usersMap.size || !contentMap.size) {
    log.info('A Circulation map returned empty, no data to send, returning');
    return;
  }

  const filledOutCirculationsMap = constructFilledOutCirculations(
    upcomingCirculations,
    circlesMap,
    contentMap,
    usersMap
  );

  const fullEmailsToSend = Array.from(filledOutCirculationsMap)
    .map(([_, circulation]) => {
      const user = usersMap.get(circulation.userId);
      if (!user) {
        return undefined;
      }

      log.info('Constructing Circulation for user', { user, circulation });

      const circulationToSend = createCirculationHtmlForUser(user, circulation);
      const usersFirstName = user.firstName;

      const emailParams = {
        from: 'Circulator <postman@circulate.social>',
        to: user.email,
        subject: `${usersFirstName}, your Circulation for today`,
        html: circulationToSend,
        'o:tag': ['circulations'],
      };

      return emailParams;
    })
    .filter((circulation) => Boolean(circulation));

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

  try {
    await cleanup(circlesMap, allUpcomingCirculations);
  } catch (error) {
    log.error('Failed to Cleanup!', {
      circlesMap,
      upcomingCirculations,
      error,
    });
    throw error;
  }
};
