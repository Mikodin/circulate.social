import { Circulation } from '@circulate/types';
import Handlebars from 'handlebars';

import circulationHtmlTemplate from './circulationTemplate';

const template = Handlebars.compile(circulationHtmlTemplate);

export const createCirculationHtmlForUser = (
  usersFirstName: string,
  circulation: Circulation
): string => {
  const circleDetailsArray = Array.from(circulation.circleDetails).map(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ([_, val]) => {
      const upcomingPosts = val.contentDetails.filter(
        (content) => !content.dateTime
      );
      const upcomingEvents = val.contentDetails.filter((content) =>
        Boolean(content.dateTime)
      );

      return { ...val, upcomingPosts, upcomingEvents };
    }
  );
  return template({
    usersFirstName,
    circulation: { ...circulation, circleDetails: circleDetailsArray },
  });
};
