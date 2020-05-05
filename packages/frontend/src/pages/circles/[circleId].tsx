import { PureComponent, Fragment } from 'react';
import { GetServerSideProps } from 'next';
import Link from 'next/link';
import { withRouter, NextRouter } from 'next/router';
import axios from 'axios';

import Register from '../../components/register/Register';
import AuthContainer from '../../components/authContainer/AuthContainer';
import Layout from '../../components/layout/Layout';
import css from './[circleId].module.scss';

import UserContext from '../../state-management/UserContext';

const GET_CIRCLE_BY_ID_ENDPOINT =
  'https://z3edrz53yg.execute-api.us-east-1.amazonaws.com/dev/circles';

interface Props {
  router: NextRouter;
}

interface State {
  circle: any;
  getCircleNotAuthorized: boolean;
  showRegisterFlow: boolean;
  isFetchingCircle: boolean;
  isFetchingJoinCircle: boolean;
}
class CirclePage extends PureComponent<Props, State> {
  state = {
    circle: undefined,
    getCircleNotAuthorized: false,
    showRegisterFlow: false,
    isFetchingCircle: true,
    isFetchingJoinCircle: false,
  };

  async componentDidMount() {
    await this.fetchCircleData();
  }

  async fetchCircleData() {
    const { join } = this.props.router.query;
    const { jwtToken } = this.context;

    if (jwtToken && !join) {
      await this.getCircle(jwtToken);
    } else if (join && jwtToken) {
      await this.joinCircle(jwtToken);
      await this.getCircle(jwtToken);
    } else if (join && !jwtToken) {
      this.setState({ showRegisterFlow: true });
    } else if (!join && !jwtToken) {
      this.setState({ getCircleNotAuthorized: true });
    }
  }

  async joinCircle(idToken: string) {
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
      const joinedCircle = createResponse.data.joined;

      this.setState({ isFetchingJoinCircle: false });
      return joinedCircle;
    } catch (error) {
      console.error('joinCircle', error);
      const { response } = error;
      if (response && response.status === 401) {
        this.setState({
          getCircleNotAuthorized: true,
        });
      }
      this.setState({ isFetchingJoinCircle: false });
      return error;
    }
  }

  async getCircle(idToken: string) {
    const { circleId } = this.props.router.query;

    this.setState({ isFetchingCircle: true });
    try {
      const createResponse = await axios.get(
        `${GET_CIRCLE_BY_ID_ENDPOINT}/${circleId}?getUpcomingEvents=true`,
        { headers: { Authorization: idToken } }
      );
      const { circle } = createResponse.data;

      this.setState({
        circle,
        getCircleNotAuthorized: false,
        showRegisterFlow: false,
        isFetchingCircle: false,
      });
      return circle;
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

  renderEvent(event) {
    return (
      <Fragment key={event.id}>
        <p>{event.name}</p>
        <p>{event.description}</p>
      </Fragment>
    );
  }

  render() {
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
            <AuthContainer onLoginSuccess={() => this.fetchCircleData()} />
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
                <Link href={`/events/submit-event?circleId=${circle.id}`}>
                  <a>Submit an event</a>
                </Link>
                {circle.upcomingEventDetails.length ? (
                  <h2>All Events</h2>
                ) : (
                  <h2>There are no upcoming events</h2>
                )}
                {circle.upcomingEventDetails.map((event) =>
                  this.renderEvent(event)
                )}
              </Fragment>
            )}
          </div>
        )}
      </Layout>
    );
  }
}
export const getServerSideProps: GetServerSideProps = async (context) => {
  return {
    props: {}, // will be passed to the page component as props
  };
};

CirclePage.contextType = UserContext;

export default withRouter(CirclePage);
