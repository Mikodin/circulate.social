import { PureComponent, Fragment } from 'react';
import { Divider, notification } from 'antd';
import { withRouter, NextRouter } from 'next/router';
import axios from 'axios';
import { Circle } from '@circulate/types';

import Layout from '../../components/layout/Layout';
import styles from './[circleId].module.scss';

import CircleInfoHeader from '../../page-components/[circleId]/CircleInfoHeader';
import CircleContent from '../../page-components/[circleId]/CircleContent';

import { API_ENDPOINT } from '../../util/constants';

import UserContext from '../../state-management/UserContext';

const GET_CIRCLE_BY_ID_ENDPOINT = `${API_ENDPOINT}/circles`;
interface Props {
  router: NextRouter;
}

interface State {
  circle: Circle | undefined;
  getCircleNotAuthorized: boolean;
  isFetchingCircle: boolean;
  isWelcomingUser: boolean;
}

class CirclePage extends PureComponent<Props, State> {
  static contextType = UserContext;

  context: React.ContextType<typeof UserContext>;

  state: State = {
    circle: undefined,
    getCircleNotAuthorized: false,
    isFetchingCircle: true,
    isWelcomingUser: true,
  };

  async componentDidMount(): Promise<void> {
    // @TODO make share something a link to submit content
    if (this.props.router.query.welcome) {
      this.setState({ isWelcomingUser: true });
      notification.success({
        message: <h3>🎉 Welcome to to the party!</h3>,
        duration: 10,
        description: (
          <div>
            <h4>You are now an essential part of this tribe.</h4>
            <p>Sharing content is the lifeblood of all Circles.</p>
            <p>You have been invited for a reason, share something!</p>
          </div>
        ),
      });
    }
    if (this.props.router.query.circleId) {
      await this.fetchCircleData();
    }
  }

  async componentDidUpdate(prevProps: Props) {
    if (!prevProps.router.query.circleId && this.props.router.query.circleId) {
      await this.fetchCircleData();
    }
  }

  async fetchCircleData(): Promise<void> {
    const { jwtToken } = this.context;

    const isLoggedIn = Boolean(jwtToken);
    if (isLoggedIn) {
      await this.getCircle(jwtToken);
    } else {
      this.setState({ getCircleNotAuthorized: true });
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
    const { circle, getCircleNotAuthorized, isFetchingCircle } = this.state;
    if (getCircleNotAuthorized) {
      this.props.router.push('/');
      return <Fragment></Fragment>;
    }

    return (
      <Layout>
        <div>
          <Fragment>
            <div className={styles.circleInfoSection}>
              <CircleInfoHeader
                circle={circle}
                isLoading={isFetchingCircle}
                jwtToken={this.context.jwtToken}
              />
            </div>
            <Divider className={styles.divider} orientation="left">
              <h3>Circulation for this week</h3>
            </Divider>
            <CircleContent circle={circle} isLoading={isFetchingCircle} />
          </Fragment>
        </div>
      </Layout>
    );
  }
}

export default withRouter(CirclePage);
