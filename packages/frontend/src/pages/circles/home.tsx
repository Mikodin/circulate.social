import { PureComponent, Fragment } from 'react';
import { withRouter, Router } from 'next/router';
import Link from 'next/link';
import axios from 'axios';
import { Circle } from '@circulate/types';
import { Divider, Skeleton } from 'antd';
import { ZoneId, ZonedDateTime, Instant } from '@js-joda/core';
import '@js-joda/timezone';

import UserContext from '../../state-management/UserContext';

import Layout from '../../components/layout/Layout';
import CircleActionsContainer from '../../components/circleActions/CircleActionsContainer';

import { API_ENDPOINT } from '../../util/constants';

import styles from './home.module.scss';

const GET_MY_CIRCLES_ENDPOINT = `${API_ENDPOINT}/circles/me`;

interface Props {
  router: Router;
}
interface State {
  circles: Circle[];
  isFetchingCircles: boolean;
  isFetchCircleError: boolean;
}
class CircleHome extends PureComponent<Props, State> {
  static contextType = UserContext;

  context: React.ContextType<typeof UserContext>;

  state = {
    circles: [],
    isFetchingCircles: true,
    isFetchCircleError: false,
  };

  async componentDidMount(): Promise<void> {
    const myCircles = await this.getMyCircles();
    this.setState({
      circles: myCircles,
    });
  }

  async getMyCircles(): Promise<Circle[]> {
    const { jwtToken, getIsUserLoggedIn } = this.context;

    try {
      const createResponse = await axios.get(GET_MY_CIRCLES_ENDPOINT, {
        headers: { Authorization: jwtToken },
      });
      const { circles } = createResponse.data;
      this.setState({ isFetchingCircles: false, isFetchCircleError: false });
      return circles;
    } catch (error) {
      console.error(error);
      // TODO: Remove, but helps debug the random issue
      console.error('isUserLoggedIn:', getIsUserLoggedIn());
      this.setState({ isFetchingCircles: false, isFetchCircleError: true });

      return [];
    }
  }

  // @TODO: Move to own component
  // eslint-disable-next-line
  renderCircle(circle: Circle): React.ReactElement {
    const createdAt = ZonedDateTime.ofInstant(
      Instant.ofEpochMilli(parseInt(circle.createdAt, 10)),
      ZoneId.SYSTEM
    )
      .toLocalDate()
      .toString();
    return (
      <div key={circle.id} className={styles.circleContainer}>
        <h2>
          <Link href="[circleId]" as={`${circle.id}`}>
            <a>{circle.name}</a>
          </Link>
        </h2>
        <div className={styles.circleInfoContainer}>
          {circle.description && <h5>{circle.description.slice(0, 120)}...</h5>}
          <p>Created: {createdAt.toString()}</p>
          <p>Members: {circle.members.length}</p>
          <p>Total Posts: {(circle.content || []).length} posts</p>
          <p>Upcoming Circulation: TBA</p>
          <p>{circle.frequency}</p>

          <div className={styles.circleActionContainer}>
            <CircleActionsContainer
              circle={circle}
              jwtToken={this.context.jwtToken}
            />
          </div>
        </div>
        <Divider className={styles.divider} />
      </div>
    );
  }

  render(): JSX.Element {
    const { circles, isFetchingCircles, isFetchCircleError } = this.state;
    return (
      <Layout>
        <div className={styles.container}>
          <h1>Your Circles</h1>
          {isFetchingCircles && <Skeleton />}
          {isFetchCircleError && (
            <h3>Whoops - something went wrong, please refresh the page</h3>
          )}

          {!isFetchingCircles && (
            <Fragment>
              <Fragment>
                {!circles.length && <h3>You do not belong to any Circles</h3>}
                <Link href="/start-a-circle">
                  <a>Want to start a Circle?</a>
                </Link>
              </Fragment>
              {Boolean(circles.length) && (
                <div className={styles.circlesContainer}>
                  {circles.map((circle) => this.renderCircle(circle))}
                </div>
              )}
            </Fragment>
          )}
        </div>
      </Layout>
    );
  }
}

export default withRouter(CircleHome);
