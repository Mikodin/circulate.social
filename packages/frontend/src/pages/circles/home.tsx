import { PureComponent } from 'react';
import { withRouter, Router } from 'next/router';
import Link from 'next/link';
import axios from 'axios';
import { Circle } from '@circulate/types';
import { Divider, Skeleton, Button } from 'antd';

import UserContext from '../../state-management/UserContext';

import Layout from '../../components/layout/Layout';
import CircleActionsContainer from '../../components/circleActions/CircleActionsContainer';

import { API_ENDPOINT } from '../../util/constants';

import styles from './home.module.scss';

export type AvailableCirclesToFetch = 'public' | 'private';

const GET_MY_CIRCLES_ENDPOINT = `${API_ENDPOINT}/circles/me`;
const GET_PUBLIC_CIRCLES_ENDPOINT = `${API_ENDPOINT}/circles/public`;

async function getCircles(
  circlesToFetch: AvailableCirclesToFetch,
  jwtToken?: string
) {
  const endpoint =
    circlesToFetch === 'public'
      ? GET_PUBLIC_CIRCLES_ENDPOINT
      : GET_MY_CIRCLES_ENDPOINT;

  const headers =
    jwtToken && circlesToFetch === 'private'
      ? {
          headers: { Authorization: jwtToken },
        }
      : undefined;

  try {
    const circles = (await axios.get(endpoint, headers)).data
      .circles as Circle[];
    return circles;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

interface Props {
  router: Router;
}
interface State {
  circles: Circle[];
  isFetchingCircles: boolean;
  isFetchCircleError: boolean;
  isShowingPublicCircles: boolean;
}
class CircleHome extends PureComponent<Props, State> {
  static contextType = UserContext;

  context: React.ContextType<typeof UserContext>;

  state = {
    circles: [],
    isFetchingCircles: true,
    isFetchCircleError: false,
    isShowingPublicCircles: false,
  };

  async componentDidMount(): Promise<void> {
    this.handleFetchingCircles('private');
  }

  async handleFetchingCircles(circlesToFetch: 'public' | 'private') {
    const { jwtToken } = this.context;
    this.setState({
      isShowingPublicCircles: circlesToFetch === 'public',
      isFetchingCircles: true,
    });

    try {
      const circles = await getCircles(circlesToFetch, jwtToken);
      this.setState({
        isFetchingCircles: false,
        isFetchCircleError: false,
        circles,
      });
    } catch (error) {
      this.setState({
        isFetchCircleError: true,
        isFetchingCircles: false,
        circles: [],
      });
    }
  }

  // @TODO: Move to own component
  // eslint-disable-next-line
  renderCircle(circle: Circle): React.ReactElement {
    const { user, jwtToken } = this.context;
    const isUserInCircle =
      user && circle.members && circle.members.includes(user.id);

    return (
      <div key={circle.id} className={styles.circleContainer}>
        <h2>
          {isUserInCircle ? (
            <Link href="[circleId]" as={`${circle.id}`}>
              <a>{circle.name}</a>
            </Link>
          ) : (
            <Link href="[circleId]/join" as={`${circle.id}/join`}>
              <a>{circle.name}</a>
            </Link>
          )}
        </h2>
        <div className={styles.circleInfoContainer}>
          {circle.description && <h5>{circle.description.slice(0, 120)}...</h5>}
          <small>
            <p>
              Posts: {(circle.content || []).length} | Sends: {circle.frequency}
            </p>
          </small>
          <small>
            <p>Members: {circle.members.length}</p>
          </small>

          {isUserInCircle ? (
            <CircleActionsContainer circle={circle} jwtToken={jwtToken} />
          ) : (
            <>
              <h3>You are not a member of this Circle.</h3>
              <Button type="primary">
                <Link href="[circleId]/join" as={`${circle.id}/join`}>
                  <a>Would you like to join?</a>
                </Link>
              </Button>
            </>
          )}
        </div>
        <Divider className={styles.divider} />
      </div>
    );
  }

  render(): JSX.Element {
    const {
      isShowingPublicCircles,
      circles,
      isFetchingCircles,
      isFetchCircleError,
    } = this.state;
    return (
      <Layout>
        <div className={styles.container}>
          <h1>
            {isShowingPublicCircles ? 'Public Circles' : 'Your Circles'} |
            <Button
              type="link"
              onClick={() =>
                this.handleFetchingCircles(
                  isShowingPublicCircles ? 'private' : 'public'
                )
              }
            >
              {isShowingPublicCircles ? 'Your Circles' : 'Public Circles'}
            </Button>
          </h1>
          <Link href="/start-a-circle">
            <a>Want to start a Circle?</a>
          </Link>

          {isFetchingCircles && <Skeleton />}

          {isFetchCircleError && (
            <h3>Whoops - something went wrong, please refresh the page</h3>
          )}

          {!isFetchingCircles && (
            <>
              {!circles.length && <h3>You do not belong to any Circles</h3>}

              {circles.length && (
                <div className={styles.circlesContainer}>
                  {circles.map((circle) => this.renderCircle(circle))}
                </div>
              )}
            </>
          )}
        </div>
      </Layout>
    );
  }
}

export default withRouter(CircleHome);
