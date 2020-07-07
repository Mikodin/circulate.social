import { Fragment, useEffect, useState } from 'react';
import { Circle, Content } from '@circulate/types';
import { Collapse, List, Skeleton } from 'antd';
import { StarOutlined } from '@ant-design/icons';
import { ZoneId, ZonedDateTime, DateTimeFormatter } from '@js-joda/core';
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
  const [events, setEvents] = useState<EventsByDate | undefined>(undefined);
  const [posts, setPosts] = useState<Content[] | undefined>(undefined);

  useEffect(() => {
    if (circle && circle.contentDetails) {
      setEvents(
        groupEventsByDate(
          (circle.contentDetails || [])
            .filter((content) => Boolean(content.dateTime))
            .map((event) => ({
              ...event,
              dateTime: convertDateTimeToSystemZone(event.dateTime),
            }))
        )
      );

      setPosts(
        (circle.contentDetails || []).filter((content) => !content.dateTime)
      );
    }
  }, [circle]);

  const hasContentToDisplay = Boolean(events && posts);

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

  return (
    <Collapse
      defaultActiveKey={['1', '2']}
      bordered={false}
      className={styles.contentCollapse}
    >
      <Panel header={<h4 className={styles.panelHeader}>Events</h4>} key="1">
        <div className={styles.eventsPanel}>
          {Object.keys(events)
            .sort()
            .reverse()
            .map((dateTime) => {
              return (
                <div key={dateTime} className={styles.eventsDayContainer}>
                  <h3 className={styles.eventDayHeader}>{dateTime}</h3>
                  <div className={styles.eventContainer}>
                    {events[dateTime].map((event) => renderEvent(event))}
                  </div>
                </div>
              );
            })}
        </div>
      </Panel>

      <Panel header={<h4 className={styles.panelHeader}>Posts</h4>} key="2">
        <div className={styles.contentPanel}>
          <List
            dataSource={posts.sort((postA, postB) => {
              const epochA = ZonedDateTime.parse(
                postA.createdAt
              ).toEpochSecond();
              const epochB = ZonedDateTime.parse(
                postB.createdAt
              ).toEpochSecond();
              return epochB - epochA;
            })}
            renderItem={renderContent}
          ></List>
        </div>
      </Panel>
    </Collapse>
  );
};

export default CircleContent;