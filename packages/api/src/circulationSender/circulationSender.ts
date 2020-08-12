import mailgunSetup from 'mailgun-js';
import { ScheduledHandler } from 'aws-lambda';
import log from 'lambda-log';
import { Condition } from 'dynamoose';
import { Circulation, Circle, Content, User } from '@circulate/types';

import UpcomingCirculationModel from '../interfaces/dynamo/upcomingCirculationModel';
import CircleModel from '../interfaces/dynamo/circlesModel';
import ContentModel from '../interfaces/dynamo/contentModel';
import UserModel from '../interfaces/dynamo/userModel';

const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY || 'test';
const MAILGUN_DOMAIN = 'mg.circulate.social';
const mailgun = mailgunSetup({
  apiKey: MAILGUN_API_KEY,
  domain: MAILGUN_DOMAIN,
});

export async function getAllCirculationComponents(
  circulations: Circulation[]
): Promise<{
  circlesMap: Map<string, Circle>;
  contentMap: Map<string, Content>;
  usersMap: Map<string, User>;
}> {
  const allCircleIdsToFetch = Array.from(
    new Set(circulations.flatMap((circulation) => circulation.circles))
  );
  const allCircles: Circle[] = (
    await CircleModel.batchGet(allCircleIdsToFetch)
  ).map((document) => JSON.parse(JSON.stringify(document.original())));

  const circlesMap: Map<string, Circle> = allCircles.reduce(
    (acc, currentCircle) => {
      acc.set(currentCircle.id, currentCircle);
      return acc;
    },
    new Map()
  );

  const allContentIdsToFetch = Array.from(
    new Set(allCircles.flatMap((circle) => circle.content))
  );
  const allContent: Content[] = (
    await ContentModel.batchGet(allContentIdsToFetch)
  ).map((document) => JSON.parse(JSON.stringify(document.original())));
  const contentMap: Map<string, Content> = allContent.reduce(
    (acc, currentContent) => {
      acc.set(currentContent.id, currentContent);
      return acc;
    },
    new Map()
  );

  const allMemberIdsToFetch = Array.from(
    new Set(allCircles.flatMap((circle) => circle.members))
  );
  const allUsers: User[] = (
    await UserModel.batchGet(allMemberIdsToFetch)
  ).map((document) => JSON.parse(JSON.stringify(document.original())));

  const usersMap: Map<string, User> = allUsers.reduce((acc, currentUser) => {
    acc.set(currentUser.id, currentUser);
    return acc;
  }, new Map());

  return {
    circlesMap,
    contentMap,
    usersMap,
  };
}

export function constructFilledOutCirculations(
  upcomingCirculations: Circulation[],
  circlesMap: Map<string, Circle>,
  contentMap: Map<string, Content>,
  usersMap: Map<string, User>
): Map<string, Circulation> {
  return upcomingCirculations.reduce((acc, currentCirculation) => {
    const circulationData = currentCirculation.circles.reduce(
      (circleDetailsAcc, circleId) => {
        const circle = circlesMap.get(circleId);

        circle.contentDetails = circle.content.map((contentId) => {
          const content = contentMap.get(contentId);
          const createdByUser = usersMap.get(content.createdBy);
          if (createdByUser) {
            content.createdBy = `${createdByUser.firstName} ${
              (createdByUser.lastName || '')[0]
            }`;
          }

          return content;
        });

        circleDetailsAcc.set(circle.id, circle);
        return circleDetailsAcc;
      },
      new Map()
    );

    acc.set(currentCirculation.urn, {
      ...currentCirculation,
      circleDetails: circulationData,
    });
    return acc;
  }, new Map());
}

export const handler: ScheduledHandler = async () => {
  log.info('Incoming event');
  const dailyFilter = new Condition('frequency').contains('');
  const upcomingDailyCirculations: Circulation[] = (
    await UpcomingCirculationModel.scan(dailyFilter).exec()
  )
    // @ts-expect-error
    .map((doc) => JSON.parse(JSON.stringify(doc.original())));

  const {
    circlesMap,
    usersMap,
    contentMap,
  } = await getAllCirculationComponents(upcomingDailyCirculations);

  const filledOutCirculationsMap = constructFilledOutCirculations(
    upcomingDailyCirculations,
    circlesMap,
    contentMap,
    usersMap
  );

  const createContentHtml = (content: Content) => `
        <p>
        ${content.title} | ${content.createdBy}
        </p>
        <span>  ${content.description}</span>
        `;

  const createCirculationForUser = (circulation: Circulation) => {
    const circlesInfo = [];
    circulation.circleDetails.forEach((circle) => {
      circlesInfo.push(`
      <h3>${circle.name}<h3>
      <h4>Content</h4>
      ${circle.contentDetails.map((content) => createContentHtml(content))}
      <hr />
      `);
    });
    return circlesInfo;
  };
  const fullEmailsToSend = Array.from(filledOutCirculationsMap).map(
    // eslint-disable-next-line
    ([_, value]) => {
      const circulationToSend = createCirculationForUser(value);
      const emailParams = {
        from: 'Test <milkman@circulate.social>',
        to: 'mfalicea58@gmail.com',
        subject: 'Your Circulation for today',
        html: `
        <h1>Heya ${
          usersMap.get(value.userId).firstName
        }, this is your Circulation</h1>
        ${circulationToSend}
        `,
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
