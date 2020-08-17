import { Circulation } from '@circulate/types';
import Handlebars from 'handlebars';

import circulationHtmlTemplate from './circulationTemplate';

const template = Handlebars.compile(circulationHtmlTemplate);

export const createCirculationHtmlForUser = (
  usersFirstName: string,
  circulation: Circulation
): string => {
  // TODO This should be moved elsewhere.  It's too hidden and happens in one place.
  // Code is hard to understand
  // Should events be seperate from posts?
  const upcomingEvents = Array.from(circulation.circleDetails).flatMap(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ([_, circle]) =>
      circle.contentDetails
        .filter((content) => content.dateTime)
        .map((event) => ({ ...event, circle }))
  );

  const circleDetailsArray = Array.from(circulation.circleDetails).map(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ([_, val]) => {
      const upcomingPosts = val.contentDetails.filter(
        (content) => !content.dateTime
      );

      return { ...val, upcomingPosts };
    }
  );
  return template({
    usersFirstName,
    circulation: {
      ...circulation,
      circleDetails: circleDetailsArray,
      upcomingEvents,
    },
  });
};
