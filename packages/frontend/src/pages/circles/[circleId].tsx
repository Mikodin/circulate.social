import { PureComponent, Fragment } from 'react';
import { GetServerSideProps } from 'next';
import { Divider } from 'antd';
import Link from 'next/link';
import { withRouter, NextRouter } from 'next/router';
import axios from 'axios';
import { Circle, Content } from '@circulate/types';
import { ZoneId, ZonedDateTime } from '@js-joda/core';

import AuthContainer from '../../components/authorization/AuthContainer';
import Layout from '../../components/layout/Layout';
import styles from './[circleId].module.scss';

import CircleInfoHeader from '../../page-components/[circleId]/CircleInfoHeader';
import CircleContent from '../../page-components/[circleId]/CircleContent';

import { API_ENDPOINT } from '../../util/constants';

import UserContext from '../../state-management/UserContext';

const GET_CIRCLE_BY_ID_ENDPOINT = `${API_ENDPOINT}/circles`;

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

interface Props {
  router: NextRouter;
}

interface State {
  circle: Circle | undefined;
  posts: Content[];
  events: Record<string, Content[]>;
  getCircleNotAuthorized: boolean;
  showRegisterFlow: boolean;
  isFetchingCircle: boolean;
  isFetchingJoinCircle: boolean;
}

class CirclePage extends PureComponent<Props, State> {
  static contextType = UserContext;

  context: React.ContextType<typeof UserContext>;

  state: State = {
    circle: undefined,
    events: {},
    posts: [],
    getCircleNotAuthorized: false,
    showRegisterFlow: false,
    isFetchingCircle: true,
    isFetchingJoinCircle: false,
  };

  async componentDidMount(): Promise<void> {
    await this.fetchCircleData();
  }

  async fetchCircleData(): Promise<void> {
    const { join } = this.props.router.query;
    const { jwtToken } = this.context;

    const isLoggedInButNotJoining = jwtToken && !join;
    const isLoggedInAndJoining = join && jwtToken;
    const isNotLoggedInAndJoining = join && !jwtToken;
    const isNotLoggedInOrJoining = !join && !jwtToken;

    if (isLoggedInButNotJoining) {
      await this.getCircle(jwtToken);
    } else if (isLoggedInAndJoining) {
      await this.joinCircle(jwtToken);
      await this.getCircle(jwtToken);
    } else if (isNotLoggedInAndJoining) {
      this.setState({ showRegisterFlow: true });
    } else if (isNotLoggedInOrJoining) {
      this.setState({ getCircleNotAuthorized: true });
    }
  }

  async joinCircle(idToken: string): Promise<boolean> {
    const { circleId } = this.props.router.query;

    this.setState({ isFetchingJoinCircle: true });
    try {
      const createResponse = await axios.post(
        `${GET_CIRCLE_BY_ID_ENDPOINT}/${circleId}/join`,
        null,
        {
          headers: { Authorization: idToken },
        }
      );
      const { joined } = createResponse.data;

      this.setState({ isFetchingJoinCircle: false });
      return Boolean(joined);
    } catch (error) {
      console.error('joinCircle', error);
      const { response } = error;

      // TODO: Deal with general error state
      if (response && response.status === 401) {
        this.setState({
          getCircleNotAuthorized: true,
        });
      }
      this.setState({ isFetchingJoinCircle: false });
      return error;
    }
  }

  async getCircle(idToken: string): Promise<Circle> {
    const { circleId } = this.props.router.query;

    this.setState({ isFetchingCircle: true });

    try {
      const createResponse = await axios.get(
        `${GET_CIRCLE_BY_ID_ENDPOINT}/${circleId}?getContentDetails=true`,
        { headers: { Authorization: idToken } }
      );
      const { circle }: { circle: Circle } = createResponse.data;

      const events = groupEventsByDate(
        (circle.contentDetails || [])
          .filter((content) => Boolean(content.dateTime))
          .map((event) => ({
            ...event,
            dateTime: convertDateTimeToSystemZone(event.dateTime),
          }))
      );
      const posts = (circle.contentDetails || []).filter(
        (content) => !content.dateTime
      );

      this.setState({
        circle,
        events,
        posts,
        getCircleNotAuthorized: false,
        showRegisterFlow: false,
        isFetchingCircle: false,
      });
      return circle as Circle;
    } catch (error) {
      console.error('getCircle', error);
      if (error.response && error.response.status === 401) {
        this.setState({
          getCircleNotAuthorized: true,
        });
      }

      this.setState({
        isFetchingCircle: false,
      });
      return error;
    }
  }

  render(): JSX.Element {
    const {
      circle,
      getCircleNotAuthorized,
      showRegisterFlow,
      isFetchingCircle,
      isFetchingJoinCircle,
    } = this.state;
    if (getCircleNotAuthorized) {
      this.props.router.push('/');
      return <Fragment></Fragment>;
    }

    return (
      <Layout>
        {showRegisterFlow ? (
          <Fragment>
            <h2>Please sign in or register to join this Circle</h2>
            <AuthContainer
              onLoginSuccess={async (): Promise<void> => {
                await this.fetchCircleData();
              }}
              onRegisterSuccess={async (): Promise<void> => {
                await this.fetchCircleData();
              }}
            />
          </Fragment>
        ) : (
          <div>
            {getCircleNotAuthorized && (
              <Fragment>
                <p>You are not permitted to view this Circle</p>
                <Link href="/">
                  <a>Return Home</a>
                </Link>
              </Fragment>
            )}

            {isFetchingJoinCircle && (
              <Fragment>
                <h2>Joining Circle</h2>
              </Fragment>
            )}

            <Fragment>
              <div className={styles.circleInfoSection}>
                <CircleInfoHeader
                  circle={circle}
                  isLoading={isFetchingCircle}
                />
              </div>
              <Divider className={styles.divider} orientation="left">
                <h3>Circulation for this week</h3>
              </Divider>
              <CircleContent circle={circle} isLoading={isFetchingCircle} />
            </Fragment>
          </div>
        )}
      </Layout>
    );
  }
}

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {}, // will be passed to the page component as props
  };
};
export default withRouter(CirclePage);
