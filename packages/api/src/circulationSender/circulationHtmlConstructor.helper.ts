import {
  ZoneId,
  ZonedDateTime,
  LocalDate,
  DateTimeFormatter,
} from '@js-joda/core';
import '@js-joda/timezone';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Locale } from '@js-joda/locale_en-us';
import Handlebars from 'handlebars';
import { Circulation, Content, User } from '@circulate/types';

import circulationHtmlTemplate from './circulationTemplate';

const template = Handlebars.compile(circulationHtmlTemplate);

function convertDateToUserTimezone(dateTime: string, timezone: string) {
  return ZonedDateTime.parse(dateTime)
    .withZoneSameInstant(ZoneId.of(timezone))
    .toString();
}

function convertTimeToUserTimezone(dateTime: string, timezone: string) {
  return ZonedDateTime.parse(dateTime)
    .withZoneSameInstant(ZoneId.of(timezone))
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
  user: User,
  circulation: Circulation
): string {
  // TODO This should be moved elsewhere.  It's too hidden and happens in one place.
  // Code is hard to understand
  // Should events be seperate from posts?
  const usersTimezone = user.timezone;
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
          dateTime: convertDateToUserTimezone(event.dateTime, usersTimezone),
          time: convertTimeToUserTimezone(event.dateTime, usersTimezone),
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
    usersFirstName: user.firstName,
    circulation: {
      ...circulation,
      circleDetails: circleDetailsArray,
      upcomingEvents: eventsByDateArray,
    },
  });
}
