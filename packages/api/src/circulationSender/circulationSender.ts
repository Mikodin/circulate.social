import mailgunSetup from 'mailgun-js';
import { ScheduledHandler } from 'aws-lambda';
import log from 'lambda-log';
import { Circulation, Circle } from '@circulate/types';

import {
  calculateFrequenciesToFetch,
  fetchUpcomingCirculations,
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

async function cleanup(
  circlesMap: Map<string, Circle>,
  upcomingCirculations: Circulation[]
): Promise<boolean> {
  const allCircleIds = Array.from(circlesMap).map(([key]) => key);
  try {
    log.info(`Clearing out [${allCircleIds.length}] circles upcoming content`);
    await clearUpcomingContentFromCircles(allCircleIds);
  } catch (error) {
    log.warn('Failed to clear upcoming content from Circles', {
      allCircleIds,
      error,
    });
    throw error;
  }

  const upcomingCirculationUrns = upcomingCirculations.map(
    (circulation) => circulation.urn
  );

  try {
    log.info(`Removing [${upcomingCirculationUrns.length}] Circulations`, {
      upcomingCirculationUrns,
    });
    await UpcomingCirculationModel.batchDelete(upcomingCirculationUrns);
  } catch (error) {
    log.warn('Failed to remove Circulations', {
      upcomingCirculationUrns,
      error,
    });
    throw error;
  }

  return true;
}

export function createOneCirculationPerUser(
  circulations: Circulation[]
): Circulation[] {
  const userCirculationMap = circulations.reduce((acc, circulation) => {
    if (acc[circulation.userId]) {
      acc[circulation.userId].circles = [
        ...acc[circulation.userId].circles,
        ...circulation.circles,
      ];
    } else {
      acc[circulation.userId] = {
        ...circulation,
        urn: `${circulation.userId}:allFrequencies`,
        circulationId: 'temp',
        frequency: 'all',
      };
    }
    return acc;
  }, {});

  return Object.values(userCirculationMap);
}

export const handler: ScheduledHandler = async () => {
  log.info('Incoming event');

  const allUpcomingCirculations = await fetchUpcomingCirculations(
    calculateFrequenciesToFetch()
    // {
    //   isBiWeeklyTimeToSend: true,
    //   isMonthlyTimeToSend: true,
    //   isWeeklyTimeToSend: true,
    // }
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
    log.info('No data to send, returning');
    return;
  }

  const filledOutCirculationsMap = constructFilledOutCirculations(
    upcomingCirculations,
    circlesMap,
    contentMap,
    usersMap
  );

  const fullEmailsToSend = Array.from(filledOutCirculationsMap).map(
    ([_, circulation]) => {
      const usersFirstName = usersMap.get(circulation.userId).firstName;
      const circulationToSend = createCirculationHtmlForUser(
        usersFirstName,
        circulation
      );

      const emailParams = {
        from: 'Circulator <postman@circulate.social>',
        to: 'mfalicea58@gmail.com',
        subject: `${usersFirstName}, your Circulation for today`,
        html: circulationToSend,
        'o:tag': ['circulations'],
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
