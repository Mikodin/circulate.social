import { PureComponent } from 'react';
import { GetServerSideProps } from 'next';
import { withRouter, NextRouter } from 'next/router';

import Layout from '../../components/layout/Layout';
import SubmitEventForm from '../../page-components/events/SubmitEventForm';

import UserContext from '../../state-management/UserContext';

interface Props {
  router: NextRouter;
}
class SubmitEvent extends PureComponent<Props, {}> {
  static contextType = UserContext;

  context: React.ContextType<typeof UserContext>;

  componentDidMount(): void {
    if (!this.context.getIsUserLoggedIn) {
      this.props.router.push('/');
    }
  }

  render(): JSX.Element {
    const { getIsUserLoggedIn } = this.context;
    const { router } = this.props;

    return getIsUserLoggedIn ? (
      <Layout>
        <main>
          <h2>Submit an event</h2>
          <SubmitEventForm seedCircleId={`${router.query.circleId}`} />
        </main>
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

export default withRouter(SubmitEvent);
