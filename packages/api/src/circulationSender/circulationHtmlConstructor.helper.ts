import {
  ZoneId,
  ZonedDateTime,
  LocalDate,
  DateTimeFormatter,
} from '@js-joda/core';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Locale } from '@js-joda/locale_en-us';
import Handlebars from 'handlebars';
import { Circulation, Content } from '@circulate/types';

import circulationHtmlTemplate from './circulationTemplate';

const template = Handlebars.compile(circulationHtmlTemplate);

function convertDateTimeToSystemZone(dateTime: string) {
  return ZonedDateTime.parse(dateTime)
    .withZoneSameInstant(ZoneId.of('UTC'))
    .toString();
}

function convertDateTimeToSystemZoneTime(dateTime: string) {
  return ZonedDateTime.parse(dateTime)
    .withZoneSameInstant(ZoneId.of('UTC'))
    .format(DateTimeFormatter.ofPattern('hh:mm a z x').withLocale(Locale.US))
    .toString();
}

function groupEventsByDate(
  events: Content[]
): {
  dateTime: string;
  events: Content[];
}[] {
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
}

export function createCirculationHtmlForUser(
  usersFirstName: string,
  circulation: Circulation
): string {
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
          time: convertDateTimeToSystemZoneTime(event.dateTime),
        }))
  );

  const eventsByDateArray = groupEventsByDate(
    upcomingEventsFromAllCircles
  ).sort((postA, postB) => {
    const epochA = LocalDate.parse(postA.dateTime).toEpochDay();
    const epochB = LocalDate.parse(postB.dateTime).toEpochDay();
    return epochB - epochA;
  });

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
}
