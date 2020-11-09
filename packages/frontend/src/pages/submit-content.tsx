import { PureComponent } from 'react';
import { withRouter, NextRouter } from 'next/router';
import Link from 'next/link';
import { Alert } from 'antd';
import { Circle, Content } from '@circulate/types';
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
  showSuccessAlert: boolean;
  isFetchingMyCircles: boolean;
  myCircles: Circle[];
  submittedContentTitle?: string;
}
class SubmitContent extends PureComponent<Props, State> {
  static contextType = UserContext;

  context: React.ContextType<typeof UserContext>;

  state = {
    showSuccessAlert: false,
    isFetchingMyCircles: true,
    myCircles: [],
    submittedContentTitle: undefined,
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

  onSubmitContentFormCompletion = (content: Partial<Content>): void => {
    const { title } = content;
    this.setState({ showSuccessAlert: true, submittedContentTitle: title });
    // @TODO Always enable the user to easily navigate back to the circle
    setTimeout(() => {
      this.setState({
        showSuccessAlert: false,
        submittedContentTitle: undefined,
      });
    }, 5000);
  };

  render(): JSX.Element {
    const { getIsUserLoggedIn } = this.context;
    const {
      showSuccessAlert,
      submittedContentTitle,
      myCircles,
      isFetchingMyCircles,
    } = this.state;
    const { router } = this.props;

    return getIsUserLoggedIn() ? (
      <Layout>
        <h2>Submit content</h2>
        <h3>What should your Circle know about and why?</h3>
        {showSuccessAlert && (
          <Alert
            type="success"
            closable
            closeText="Hide"
            banner
            afterClose={() => {
              this.setState({
                showSuccessAlert: false,
                submittedContentTitle: undefined,
              });
            }}
            message="Success!"
            description={
              <>
                <p>
                  Successfully submitted &quot;{submittedContentTitle}&quot;!
                </p>
                <div>
                  <Link
                    key="GoToCircle"
                    href="/circles/[cirleId]"
                    as={`/circles/${router.query.circleId}`}
                  >
                    <a>Go to Circle</a>
                  </Link>
                </div>
              </>
            }
          ></Alert>
        )}
        <SubmitContentForm
          seedCircleId={`${router.query.circleId}`}
          jwtToken={this.context.jwtToken}
          onFormCompletion={this.onSubmitContentFormCompletion}
          myCircles={myCircles}
          isFetchingMyCircles={isFetchingMyCircles}
        />
      </Layout>
    ) : (
      <div></div>
    );
  }
}

export default withRouter(SubmitContent);
