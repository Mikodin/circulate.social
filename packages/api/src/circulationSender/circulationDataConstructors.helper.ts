import log from 'lambda-log';
import { Circulation, Circle, Content, User } from '@circulate/types';
import CircleModel from '../interfaces/dynamo/circlesModel';
import ContentModel from '../interfaces/dynamo/contentModel';
import UserModel from '../interfaces/dynamo/userModel';

export async function getAllContentAndUsersFromCircles(
  circles: Circle[]
): Promise<{ content: Content[]; users: User[] }> {
  let content: Content[];
  let users: User[];

  const contentIds = Array.from(
    new Set(circles.flatMap((circle) => circle.content))
  );

  const userIds = Array.from(
    new Set(circles.flatMap((circle) => circle.members))
  );

  try {
    content = (await ContentModel.batchGet(contentIds)).map((document) =>
      JSON.parse(JSON.stringify(document.original()))
    );
  } catch (fetchContentError) {
    log.warn('Failed to fetch Content', { contentIds, fetchContentError });
    throw fetchContentError;
  }

  try {
    users = (await UserModel.batchGet(userIds)).map((document) =>
      JSON.parse(JSON.stringify(document.original()))
    );
  } catch (fetchUsersError) {
    log.warn('Failed to fetch Users', { userIds, fetchUsersError });
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

  const { content, users } = await getAllContentAndUsersFromCircles(circles);

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
