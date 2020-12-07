import { PureComponent, Fragment } from 'react';
import { Divider, Alert } from 'antd';
import { withRouter, NextRouter } from 'next/router';
import Link from 'next/link';
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
    isWelcomingUser: false,
  };

  async componentDidMount(): Promise<void> {
    if (this.props.router.query.isWelcomingUser) {
      this.welcomeUser();
    }
    if (this.props.router.query.circleId) {
      await this.fetchCircleData();
    }
  }

  async componentDidUpdate(prevProps: Props) {
    if (!prevProps.router.query.circleId && this.props.router.query.circleId) {
      await this.fetchCircleData();
    }

    if (
      !prevProps.router.query.isWelcomingUser &&
      this.props.router.query.isWelcomingUser
    ) {
      this.welcomeUser();
    }
  }

  welcomeUser() {
    this.setState({ isWelcomingUser: true });
    setTimeout(() => {
      this.setState({ isWelcomingUser: false });
    }, 7000);
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
    const {
      circle,
      getCircleNotAuthorized,
      isFetchingCircle,
      isWelcomingUser,
    } = this.state;
    if (getCircleNotAuthorized) {
      this.props.router.push('/');
      return <Fragment></Fragment>;
    }

    return (
      <Layout>
        <div>
          <Fragment>
            {isWelcomingUser && (
              <>
                <Alert
                  closable
                  message={<h3>🎉 Welcome to to the party!</h3>}
                  description={
                    <div>
                      <h4>You are now an essential part of this tribe.</h4>
                      <p>Sharing content is the lifeblood of all Circles.</p>
                      <p>
                        You have been invited for a reason,{' '}
                        {!circle || isFetchingCircle ? (
                          'share something!'
                        ) : (
                          <Link href={`/submit-content?circleId=${circle.id}`}>
                            <a>share something!</a>
                          </Link>
                        )}
                      </p>
                    </div>
                  }
                  type="success"
                />
                <Divider />
              </>
            )}

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
            <CircleContent
              circle={circle}
              isLoading={isFetchingCircle}
              jwtToken={this.context.jwtToken}
            />
          </Fragment>
        </div>
      </Layout>
    );
  }
}

export default withRouter(CirclePage);
