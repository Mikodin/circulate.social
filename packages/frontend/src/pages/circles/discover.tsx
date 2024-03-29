import { PureComponent } from 'react';
import { withRouter, Router } from 'next/router';
import Link from 'next/link';
import axios from 'axios';
import { Circle } from '@circulate/types';
import { Skeleton, Button } from 'antd';

import UserContext from '../../state-management/UserContext';

import Layout from '../../components/layout/Layout';
import CirclePreview from '../../components/circlePreview/CirclePreview';

import { API_ENDPOINT } from '../../util/constants';

import styles from './discover.module.scss';

export type AvailableCirclesToFetch = 'public' | 'private';

const GET_PUBLIC_CIRCLES_ENDPOINT = `${API_ENDPOINT}/circles/public`;

async function getCircles() {
  const endpoint = GET_PUBLIC_CIRCLES_ENDPOINT;

  try {
    const circles = (await axios.get(endpoint)).data.circles as Circle[];
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
    this.handleFetchingCircles();
  }

  async handleFetchingCircles() {
    this.setState({
      isFetchingCircles: true,
    });

    try {
      const circles = await getCircles();
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

  render(): JSX.Element {
    const { circles, isFetchingCircles, isFetchCircleError } = this.state;
    const { jwtToken, user } = this.context;

    const circlesTheUserIsNotAlreadyIn = circles.filter((circle) => {
      const isUserInCircle =
        user && circle.members && circle.members.includes(user.id);
      return !isUserInCircle;
    });

    return (
      <Layout>
        <div className={styles.container}>
          <h1>Public Circles</h1>
          <Link href="/start-a-circle">
            <a>Want to start a Circle?</a>
          </Link>

          {isFetchingCircles && <Skeleton />}

          {isFetchCircleError && (
            <h3>Whoops - something went wrong, please refresh the page</h3>
          )}

          {!isFetchingCircles && (
            <>
              {!circlesTheUserIsNotAlreadyIn.length && (
                <>
                  <h1>🤯</h1>
                  <h3>
                    It appears that you are already a member of every public
                    circle!
                  </h3>
                  <p>Well done.</p>
                  <Button type="primary">
                    <Link href="/circles/home">
                      <a>Now go view them!</a>
                    </Link>
                  </Button>
                </>
              )}
              {Boolean(circlesTheUserIsNotAlreadyIn.length) && (
                <div className={styles.circlesContainer}>
                  {circlesTheUserIsNotAlreadyIn.map((circle) => {
                    return (
                      <CirclePreview
                        key={circle.id}
                        circle={circle}
                        jwtToken={jwtToken}
                        isUserInCircle={false}
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
