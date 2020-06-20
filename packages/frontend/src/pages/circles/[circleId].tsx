import { PureComponent, Fragment } from 'react';
import { GetServerSideProps } from 'next';
import Link from 'next/link';
import { withRouter, NextRouter } from 'next/router';
import axios from 'axios';
import { Circle } from '@circulate/types';

import AuthContainer from '../../components/authorization/AuthContainer';
import Layout from '../../components/layout/Layout';
// import css from './[circleId].module.scss';

import { API_ENDPOINT } from '../../util/constants';

import UserContext from '../../state-management/UserContext';

const GET_CIRCLE_BY_ID_ENDPOINT = `${API_ENDPOINT}/circles`;

interface Props {
  router: NextRouter;
}

interface State {
  circle: Circle | undefined;
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

      this.setState({
        circle,
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

  // @TODO: Move to own component
  // eslint-disable-next-line
  renderEvent(event) {
    return (
      <Fragment key={event.id}>
        <p>{event.name}</p>
        <p>{event.description}</p>
      </Fragment>
    );
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
              onLoginSuccess={(): void => {
                this.fetchCircleData();
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

            {Boolean(isFetchingCircle && !isFetchingJoinCircle) && (
              <Fragment>
                <h2>Loading Circle</h2>
              </Fragment>
            )}
            {isFetchingJoinCircle && (
              <Fragment>
                <h2>Joining Circle</h2>
              </Fragment>
            )}

            {circle && (
              <Fragment>
                <h1>Circle: {circle.name}</h1>
                <h2>Description: {circle.description}</h2>
                <Link href={`/submit-content?circleId=${circle.id}`}>
                  <a>Submit an event</a>
                </Link>
                {circle.contentDetails.length ? (
                  <h2>All Events</h2>
                ) : (
                  <h2>There are no upcoming events</h2>
                )}
                {circle.contentDetails.map((event) => this.renderEvent(event))}
              </Fragment>
            )}
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
