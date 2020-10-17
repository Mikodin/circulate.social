import { PureComponent } from 'react';
import { withRouter, NextRouter } from 'next/router';
import Link from 'next/link';
import { Result, Button } from 'antd';
import { Circle } from '@circulate/types';
import Axios from 'axios';

import Layout from '../components/layout/Layout';
import SubmitContentForm from '../page-components/submit-content/SubmitContentForm';
import { API_ENDPOINT } from '../util/constants';

import UserContext from '../state-management/UserContext';

const GET_MY_CIRCLES_ENDPOINT = `${API_ENDPOINT}/circles/me`;

interface Props {
  router: NextRouter;
}

interface State {
  showContentForm: boolean;
  isFetchingMyCircles: boolean;
  myCircles: Circle[];
}
class SubmitContent extends PureComponent<Props, State> {
  static contextType = UserContext;

  context: React.ContextType<typeof UserContext>;

  state = {
    showContentForm: true,
    isFetchingMyCircles: true,
    myCircles: [],
  };

  async componentDidMount(): Promise<void> {
    if (!this.context.getIsUserLoggedIn()) {
      this.props.router.push('/');
    }

    const myCircles = await this.fetchMyCircles();
    this.setState({ myCircles });
  }

  fetchMyCircles = async (): Promise<Circle[]> => {
    const { jwtToken } = this.context;
    this.setState({
      isFetchingMyCircles: true,
    });
    const myCircles = (
      await Axios.get(GET_MY_CIRCLES_ENDPOINT, {
        headers: { Authorization: jwtToken },
      })
    ).data.circles as Circle[];

    this.setState({
      isFetchingMyCircles: false,
    });
    return myCircles;
  };

  onSubmitContentFormCompletion = (): void => {
    this.setState({ showContentForm: false });
  };

  render(): JSX.Element {
    const { getIsUserLoggedIn } = this.context;
    const { showContentForm, myCircles, isFetchingMyCircles } = this.state;
    const { router } = this.props;

    return getIsUserLoggedIn() ? (
      <Layout>
        <h2>Submit content</h2>
        <h3>What should your Circle know about and why?</h3>
        {showContentForm && (
          <SubmitContentForm
            seedCircleId={`${router.query.circleId}`}
            jwtToken={this.context.jwtToken}
            onFormCompletion={this.onSubmitContentFormCompletion}
            myCircles={myCircles}
            isFetchingMyCircles={isFetchingMyCircles}
          />
        )}
        {!showContentForm && (
          <Result
            status="success"
            title="Success!"
            subTitle="Your content will go out with the next Circulation"
            extra={[
              <Link
                key="GoToCircle"
                href="/circles/[cirleId]"
                as={`/circles/${router.query.circleId}`}
              >
                <a>Go to Circle</a>
              </Link>,
              <Button
                type="primary"
                key="console"
                onClick={(): void => this.setState({ showContentForm: true })}
              >
                Submit more content
              </Button>,
            ]}
          />
        )}
      </Layout>
    ) : (
      <div></div>
    );
  }
}

export default withRouter(SubmitContent);
