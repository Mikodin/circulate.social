import { Fragment, useEffect, useState } from 'react';
import { Circle, Content } from '@circulate/types';
import { Collapse, List, Skeleton } from 'antd';
import { StarOutlined } from '@ant-design/icons';
import {
  ZoneId,
  ZonedDateTime,
  DateTimeFormatter,
  LocalDate,
} from '@js-joda/core';
import { Locale } from '@js-joda/locale_en-us';
import '@js-joda/timezone';

import styles from './circleContent.module.scss';

const { Panel } = Collapse;

const convertDateTimeToSystemZone = (dateTime: string) => {
  return ZonedDateTime.parse(dateTime)
    .withZoneSameInstant(ZoneId.of('SYSTEM'))
    .toString();
};

const groupEventsByDate = (events: Content[]): Record<string, Content[]> => {
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

  return eventsByDate;
};

const renderContent = (content: Content) => {
  const header = content.link ? (
    <h4>
      <StarOutlined /> {''}
      <a href={content.link} target="_blank" rel="noreferrer">
        {content.title}
      </a>{' '}
      | {content.createdBy}
    </h4>
  ) : (
    <h4>
      <StarOutlined /> {''}
      {content.title} | {content.createdBy}
    </h4>
  );
  return (
    <Fragment key={content.id}>
      {header}
      <small>
        {ZonedDateTime.parse(content.createdAt)
          .withZoneSameInstant(ZoneId.of('SYSTEM'))
          .toLocalDate()
          .toString()}
      </small>
      <p>{content.description}</p>
    </Fragment>
  );
};
const renderEvent = (event: Content) => {
  const dtf = DateTimeFormatter.ofPattern('h:mm a').withLocale(Locale.US);
  const timeString = ZonedDateTime.parse(event.dateTime).format(dtf);

  const header = event.link ? (
    <h4>
      <StarOutlined /> {''}
      {timeString.toString()}{' '}
      <a href={event.link} target="_blank" rel="noreferrer">
        {event.title}
      </a>{' '}
      | {event.createdBy}
    </h4>
  ) : (
    <h4>
      <StarOutlined /> {''}
      {timeString.toString()} {event.title} | {event.createdBy}
    </h4>
  );

  return (
    <Fragment key={event.id}>
      {header}
      <small>
        {ZonedDateTime.parse(event.createdAt)
          .withZoneSameInstant(ZoneId.of('SYSTEM'))
          .toLocalDate()
          .toString()}
      </small>
      {event.description && <p>{event.description}</p>}
    </Fragment>
  );
};
interface Props {
  circle: Circle;
  isLoading: boolean;
}
interface EventsByDate {
  [dateTime: string]: Content[];
}

const CircleContent = (props: Props): JSX.Element => {
  const { circle, isLoading } = props;
  const [upcomingEvents, setUpcomingEvents] = useState<
    EventsByDate | undefined
  >(undefined);
  const [pastEvents, setPastEvents] = useState<EventsByDate | undefined>(
    undefined
  );
  const [posts, setPosts] = useState<Content[] | undefined>(undefined);

  useEffect(() => {
    if (circle && circle.contentDetails) {
      const eventsWithDateConvertedToUsersTime = (circle.contentDetails || [])
        .filter((content) => Boolean(content.dateTime))
        .map((event) => ({
          ...event,
          dateTime: convertDateTimeToSystemZone(event.dateTime),
        }));

      const upcomingEventsFiltered = eventsWithDateConvertedToUsersTime.filter(
        (event) =>
          ZonedDateTime.parse(event.dateTime).isAfter(ZonedDateTime.now())
      );

      const pastEventsFiltered = eventsWithDateConvertedToUsersTime.filter(
        (event) =>
          ZonedDateTime.parse(event.dateTime).isBefore(ZonedDateTime.now())
      );

      setUpcomingEvents(groupEventsByDate(upcomingEventsFiltered));
      setPastEvents(groupEventsByDate(pastEventsFiltered));

      setPosts(
        (circle.contentDetails || [])
          .filter((content) => !content.dateTime)
          .sort((postA, postB) => {
            const epochA = ZonedDateTime.parse(postA.createdAt).toEpochSecond();
            const epochB = ZonedDateTime.parse(postB.createdAt).toEpochSecond();
            return epochB - epochA;
          })
      );
    }
  }, [circle]);

  const hasContentToDisplay = Boolean(upcomingEvents && posts);

  if (isLoading) {
    return <Skeleton active={isLoading} />;
  }

  if (!hasContentToDisplay) {
    return (
      <>
        <h2>
          There are no posts <span>💔</span>
        </h2>
      </>
    );
  }
  const pastEventsPanel = (
    <Panel header={<a>Looking for past events?</a>} showArrow={false} key="3">
      <div className={`${styles.pastEventsCollapse} ${styles.eventsPanel}`}>
        {Object.keys(pastEvents || {})
          .sort()
          .reverse()
          .map((dateTime) => {
            return (
              <div key={dateTime} className={styles.eventsDayContainer}>
                <h3 className={styles.eventDayHeader}>
                  {LocalDate.parse(dateTime).format(
                    DateTimeFormatter.ofPattern('E, MMM d yyyy').withLocale(
                      Locale.US
                    )
                  )}
                </h3>
                <div className={styles.eventContainer}>
                  {pastEvents[dateTime].map((event) => renderEvent(event))}
                </div>
              </div>
            );
          })}
      </div>
    </Panel>
  );

  const allEventsPanel = (
    <Panel
      header={<h4 className={styles.panelHeader}>Upcoming events</h4>}
      key="1"
    >
      <div className={styles.eventsPanel}>
        {Object.keys(upcomingEvents || {})
          .sort()
          .reverse()
          .map((dateTime) => {
            return (
              <div key={dateTime} className={styles.eventsDayContainer}>
                <h3 className={styles.eventDayHeader}>
                  {LocalDate.parse(dateTime).format(
                    DateTimeFormatter.ofPattern('E, MMM d yyyy').withLocale(
                      Locale.US
                    )
                  )}
                </h3>
                <div className={styles.eventContainer}>
                  {upcomingEvents[dateTime].map((event) => renderEvent(event))}
                </div>
              </div>
            );
          })}
      </div>
      <Collapse bordered={false}>{pastEventsPanel}</Collapse>
    </Panel>
  );

  const postsPanel = (
    <Panel header={<h4 className={styles.panelHeader}>Posts</h4>} key="2">
      <div className={styles.contentPanel}>
        <List dataSource={posts} renderItem={renderContent}></List>
      </div>
    </Panel>
  );

  return (
    <Collapse
      defaultActiveKey={['1', '2']}
      bordered={false}
      className={styles.contentCollapse}
    >
      {Object.keys(upcomingEvents).length && allEventsPanel}
      {posts.length && postsPanel}
      {!Object.keys(upcomingEvents).length &&
        Object.keys(pastEvents) &&
        pastEventsPanel}
    </Collapse>
  );
};

export default CircleContent;
