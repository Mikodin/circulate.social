import { PureComponent, Fragment } from 'react';
import { withRouter, Router } from 'next/router';
import Link from 'next/link';
import axios from 'axios';
import { Circle } from '@circulate/types';

import Layout from '../../components/layout/Layout';

import UserContext from '../../state-management/UserContext';
import css from './home.module.scss';

import { API_ENDPOINT } from '../../util/constants';

const GET_MY_CIRCLES_ENDPOINT = `${API_ENDPOINT}/circles`;

interface Props {
  router: Router;
}
interface State {
  circles: Circle[];
  isFetchingCircles: boolean;
}
class CircleHome extends PureComponent<Props, State> {
  static contextType = UserContext;

  context: React.ContextType<typeof UserContext>;

  state = {
    circles: [],
    isFetchingCircles: true,
  };

  async componentDidMount(): Promise<void> {
    const myCircles = await this.getMyCircles();
    this.setState({
      circles: myCircles,
    });
  }

  async getMyCircles(): Promise<Circle[]> {
    const { jwtToken } = this.context;

    try {
      const createResponse = await axios.get(`${GET_MY_CIRCLES_ENDPOINT}/me`, {
        headers: { Authorization: jwtToken },
      });
      const { circles } = createResponse.data;
      this.setState({ isFetchingCircles: false });
      return circles;
    } catch (error) {
      console.error(error);
      this.setState({ isFetchingCircles: false });
      this.props.router.push('/');

      return [];
    }
  }

  // @TODO: Move to own component
  // eslint-disable-next-line
  renderCircle(circle: any): React.ReactElement {
    return (
      <div key={circle.id} className={css.circleContainer}>
        <h2>
          Name:{' '}
          <Link href="[circleId]" as={`${circle.id}`}>
            <a>{circle.name}</a>
          </Link>
        </h2>
        <p>Description: {circle.description}</p>
        <p># of Upcoming Events: {circle.events.length}</p>
      </div>
    );
  }

  render(): JSX.Element {
    const { circles, isFetchingCircles } = this.state;
    return (
      <Layout>
        <div className={css.container}>
          <h1>Your Circles</h1>
          {isFetchingCircles && (
            <Fragment>
              <h3>Loading</h3>
            </Fragment>
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
                <div className={css.circlesContainer}>
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
