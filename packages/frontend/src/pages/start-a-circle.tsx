import { PureComponent, Fragment } from 'react';
import { withRouter, NextRouter } from 'next/router';

import Layout from '../components/layout/Layout';
import StartCircleForm from '../page-components/start-a-circle/StartCircleForm';
import AuthContainer, {
  AUTH_FORMS,
} from '../components/authorization-old/AuthContainer';

import UserContext from '../state-management/UserContext';

interface Props {
  router: NextRouter;
}
class StartACircle extends PureComponent<Props, {}> {
  render(): JSX.Element {
    const { getIsUserLoggedIn } = this.context;
    return (
      <Layout>
        <div>
          <h2>Start a Circle</h2>
          {getIsUserLoggedIn() ? (
            <StartCircleForm />
          ) : (
            <Fragment>
              <p>You must be signed in to Start a Circle</p>
              <AuthContainer seedForm={AUTH_FORMS.login} />
            </Fragment>
          )}
        </div>
      </Layout>
    );
  }
}

StartACircle.contextType = UserContext;

export default withRouter(StartACircle);
