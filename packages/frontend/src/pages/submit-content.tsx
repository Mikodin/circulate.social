import { PureComponent } from 'react';
import { GetServerSideProps } from 'next';
import { withRouter, NextRouter } from 'next/router';

import Layout from '../components/layout/Layout';
import SubmitContentForm from '../page-components/submit-content/SubmitContentForm';

import UserContext from '../state-management/UserContext';

interface Props {
  router: NextRouter;
}
class SubmitContent extends PureComponent<Props, {}> {
  static contextType = UserContext;

  context: React.ContextType<typeof UserContext>;

  componentDidMount(): void {
    if (!this.context.getIsUserLoggedIn()) {
      this.props.router.push('/');
    }
  }

  render(): JSX.Element {
    const { getIsUserLoggedIn } = this.context;
    const { router } = this.props;

    return getIsUserLoggedIn() ? (
      <Layout>
        <h2>Submit content</h2>
        <SubmitContentForm
          seedCircleId={`${router.query.circleId}`}
          jwtToken={this.context.jwtToken}
        />
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
