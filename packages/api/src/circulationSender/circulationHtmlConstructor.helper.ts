import { ZoneId, ZonedDateTime } from '@js-joda/core';
import { Circulation, Content } from '@circulate/types';
import Handlebars from 'handlebars';

import circulationHtmlTemplate from './circulationTemplate';

const template = Handlebars.compile(circulationHtmlTemplate);

const convertDateTimeToSystemZone = (dateTime: string) => {
  return ZonedDateTime.parse(dateTime)
    .withZoneSameInstant(ZoneId.of('SYSTEM'))
    .toString();
};

const groupEventsByDate = (
  events: Content[]
): {
  dateTime: string;
  events: Content[];
}[] => {
  const eventsByDate = {};
  events.forEach((event) => {
    if (!event.dateTime) {
      return;
    }

    const date = ZonedDateTime.parse(event.dateTime)
      .withZoneSameInstant(ZoneId.of('SYSTEM'))
      .toLocalDate()
      .toString();

    if (eventsByDate[date]) {
      eventsByDate[date].push(event);
    } else {
      eventsByDate[date] = [event];
    }
  });
  return Object.keys(eventsByDate).map((dateKey) => {
    return {
      dateTime: dateKey,
      events: eventsByDate[dateKey],
    };
  });
};

export const createCirculationHtmlForUser = (
  usersFirstName: string,
  circulation: Circulation
): string => {
  // TODO This should be moved elsewhere.  It's too hidden and happens in one place.
  // Code is hard to understand
  // Should events be seperate from posts?
  const upcomingEventsFromAllCircles = Array.from(
    circulation.circleDetails
  ).flatMap(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ([_, circle]) =>
      circle.contentDetails
        .filter((content) => content.dateTime)
        .map((event) => ({
          ...event,
          circle,
          dateTime: convertDateTimeToSystemZone(event.dateTime),
        }))
  );

  const eventsByDateArray = groupEventsByDate(upcomingEventsFromAllCircles);

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
      upcomingEvents: eventsByDateArray,
    },
  });
};
