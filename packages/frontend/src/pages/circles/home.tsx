import { PureComponent } from 'react';
import { withRouter, Router } from 'next/router';
import Link from 'next/link';
import axios from 'axios';
import { Circle } from '@circulate/types';
import { Skeleton } from 'antd';

import UserContext from '../../state-management/UserContext';

import Layout from '../../components/layout/Layout';
import CirclePreview from '../../components/circlePreview/CirclePreview';

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
    this.handleFetchingCircles('private');
  }

  async handleFetchingCircles(circlesToFetch: 'public' | 'private') {
    const { jwtToken } = this.context;
    this.setState({
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

  render(): JSX.Element {
    const { circles, isFetchingCircles, isFetchCircleError } = this.state;
    const { jwtToken, user } = this.context;

    return (
      <Layout>
        <div className={styles.container}>
          <h1>Your Circles</h1>
          <Link href="/start-a-circle">
            <a>Want to start a Circle? </a>
          </Link>
          <Link href="/circles/discover">
            <a>Discover public Circles</a>
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
                  {circles.map((circle) => {
                    const isUserInCircle =
                      user &&
                      circle.members &&
                      circle.members.includes(user.id);
                    return (
                      <CirclePreview
                        key={circle.id}
                        circle={circle}
                        isUserInCircle={isUserInCircle}
                        jwtToken={jwtToken}
                      />
                    );
                  })}
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
