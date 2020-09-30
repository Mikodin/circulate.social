import log from 'lambda-log';
import { LocalDate } from '@js-joda/core';
import { Circulation, Circle, Content, User } from '@circulate/types';
import { Condition } from 'dynamoose';

import CircleModel from '../interfaces/dynamo/circlesModel';
import ContentModel from '../interfaces/dynamo/contentModel';
import UserModel from '../interfaces/dynamo/userModel';
import UpcomingCirculationModel from '../interfaces/dynamo/upcomingCirculationModel';

export function calculateFrequenciesToFetch(): {
  isWeeklyTimeToSend: boolean;
  isMonthlyTimeToSend: boolean;
} {
  const today = LocalDate.now();
  const isWeeklyTimeToSend = Boolean(today.dayOfWeek().value() === 5);

  const isMonthlyTimeToSend = Boolean(
    today.dayOfMonth() === today.lengthOfMonth()
  );

  const frequenciesToFetch = {
    isWeeklyTimeToSend,
    isMonthlyTimeToSend,
  };

  log.info('Calculated frequencies to fetch', frequenciesToFetch);

  return frequenciesToFetch;
}

export async function fetchUpcomingCirculations(frequenciesToFetch: {
  isWeeklyTimeToSend: boolean;
  isMonthlyTimeToSend: boolean;
}): Promise<Circulation[]> {
  const { isWeeklyTimeToSend, isMonthlyTimeToSend } = frequenciesToFetch;
  // Always fetch daily
  let filter = new Condition('frequency').contains('daily');

  // Allow the filter to build on itself through each if statement
  if (isWeeklyTimeToSend) {
    filter = filter.or().where('frequency').contains('weekly');
  }

  if (isMonthlyTimeToSend) {
    filter = filter.or().where('frequency').contains('monthly');
  }

  return (await UpcomingCirculationModel.scan(filter).all().exec()).map((doc) =>
    JSON.parse(JSON.stringify(doc.original()))
  );
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

export async function getAllContentAndUsersFromAllCircles(
  circles: Circle[]
): Promise<{ content: Content[]; users: User[] }> {
  let content: Content[];
  let users: User[];

  const allUpcomingContentIds = Array.from(
    new Set(circles.flatMap((circle) => circle.upcomingContentIds))
  );

  if (!allUpcomingContentIds.length) {
    return { content: [], users: [] };
  }

  if (allUpcomingContentIds.length > 100) {
    log.warn('Trying to fetch more than 100 items');
    // @TODO get an alert on this
    throw new Error(
      'Trying to fetch more than 100 ContentIds.  This will fail on Dynamos side'
    );
  }

  try {
    content = (
      await ContentModel.batchGet(allUpcomingContentIds)
    ).map((document) => JSON.parse(JSON.stringify(document.original())));
  } catch (fetchContentError) {
    log.warn('Failed to fetch Content', {
      allUpcomingContentIds,
      fetchContentError,
    });
    throw fetchContentError;
  }

  const allUserIds = Array.from(
    new Set(circles.flatMap((circle) => circle.members))
  );

  if (!allUserIds.length) {
    log.warn('Somehow no Circles have any members - how am I here?');
    // @TODO get an alert on this
    throw new Error('Somehow no Circles have any members - how am I here?');
  }

  try {
    users = (await UserModel.batchGet(allUserIds)).map((document) =>
      JSON.parse(JSON.stringify(document.original()))
    );
  } catch (fetchUsersError) {
    log.warn('Failed to fetch Users', { allUserIds, fetchUsersError });
    throw fetchUsersError;
  }

  return { content, users };
}

export async function getAllCirclesContentAndUsers(
  circleIds: string[]
): Promise<{ circles: Circle[]; content: Content[]; users: User[] }> {
  let circles: Circle[];

  try {
    circles = (await CircleModel.batchGet(circleIds)).map((document) =>
      JSON.parse(JSON.stringify(document.original()))
    );
  } catch (fetchCirclesError) {
    log.warn('Failed to fetch Circles', { circleIds, fetchCirclesError });
    throw fetchCirclesError;
  }

  const { content, users } = await getAllContentAndUsersFromAllCircles(circles);

  return {
    circles,
    content,
    users,
  };
}

export async function constructCirculationComponentMaps(
  circulations: Circulation[]
): Promise<{
  circlesMap: Map<string, Circle>;
  contentMap: Map<string, Content>;
  usersMap: Map<string, User>;
}> {
  const allCircleIdsToFetch = Array.from(
    new Set(circulations.flatMap((circulation) => circulation.circles))
  );

  const { circles, content, users } = await getAllCirclesContentAndUsers(
    allCircleIdsToFetch
  );

  const circlesMap: Map<string, Circle> = circles.reduce(
    (acc, currentCircle) => {
      acc.set(currentCircle.id, currentCircle);
      return acc;
    },
    new Map()
  );

  const contentMap: Map<string, Content> = content.reduce(
    (acc, currentContent) => {
      acc.set(currentContent.id, currentContent);
      return acc;
    },
    new Map()
  );

  const usersMap: Map<string, User> = users.reduce((acc, currentUser) => {
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

        circle.contentDetails = circle.content.reduce(
          (contentDetailsAcc, contentId) => {
            const content = contentMap.get(contentId);
            if (!content) {
              return contentDetailsAcc;
            }

            const createdByUser = usersMap.get(content.createdBy || '');
            if (createdByUser) {
              content.createdBy = `${createdByUser.firstName} ${
                (createdByUser.lastName || '')[0]
              }`;
            }
            contentDetailsAcc.push(content);
            return contentDetailsAcc;
          },
          []
        );

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

export async function clearUpcomingContentFromCircles(
  circleIds: string[]
): Promise<void> {
  if (!circleIds.length) {
    return;
  }

  await Promise.all(
    circleIds.map((circleId) =>
      CircleModel.update({ id: circleId }, { $SET: { upcomingContentIds: [] } })
    )
  );
}

export async function cleanup(
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
