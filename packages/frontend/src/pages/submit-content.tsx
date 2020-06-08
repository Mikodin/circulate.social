import { PureComponent } from 'react';
import { GetServerSideProps } from 'next';
import { withRouter, NextRouter } from 'next/router';
import Link from 'next/link';
import { Result, Button } from 'antd';

import Layout from '../components/layout/Layout';
import SubmitContentForm from '../page-components/submit-content/SubmitContentForm';

import UserContext from '../state-management/UserContext';

interface Props {
  router: NextRouter;
}

interface State {
  showContentForm: boolean;
}
class SubmitContent extends PureComponent<Props, State> {
  static contextType = UserContext;

  context: React.ContextType<typeof UserContext>;

  state = {
    showContentForm: true,
  };

  componentDidMount(): void {
    if (!this.context.getIsUserLoggedIn()) {
      this.props.router.push('/');
    }
  }

  onSubmitContentFormCompletion = (): void => {
    this.setState({ showContentForm: false });
  };

  render(): JSX.Element {
    const { getIsUserLoggedIn } = this.context;
    const { showContentForm } = this.state;
    const { router } = this.props;

    return getIsUserLoggedIn() ? (
      <Layout>
        <h2>Submit content</h2>
        {showContentForm && (
          <SubmitContentForm
            seedCircleId={`${router.query.circleId}`}
            jwtToken={this.context.jwtToken}
            onFormCompletion={this.onSubmitContentFormCompletion}
          />
        )}
        {!showContentForm && (
          <Result
            status="success"
            title="Successfully Put Content into Circulation!"
            subTitle="{Title} will go out with the next Circulation"
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
export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {}, // will be passed to the page component as props
  };
};

export default withRouter(SubmitContent);
