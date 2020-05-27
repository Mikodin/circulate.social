import { PureComponent, Fragment } from 'react';
import { withRouter, NextRouter } from 'next/router';

import Layout from '../components/layout/Layout';
import StartCircleForm from '../page-components/start-a-circle/StartCircleForm';
import AuthContainer, {
  AUTH_FORMS,
} from '../components/authorization/AuthContainer';

import css from './start-a-circle.module.scss';
import UserContext from '../state-management/UserContext';

interface Props {
  router: NextRouter;
}
class StartACircle extends PureComponent<Props, {}> {
  static contextType = UserContext;

  context: React.ContextType<typeof UserContext>;

  render(): JSX.Element {
    const { getIsUserLoggedIn, jwtToken } = this.context;
    return (
      <Layout>
        <div>
          <div className={css.headerContainer}>
            <h1>Start a Circle</h1>
            <h4>
              The most relevant, curated newsletter you’ve ever subscribed to
              starts here.
            </h4>
          </div>
          <div className={css.stepsContainer}>
            <ul className={css.progressbar}>
              <li className={css.active}>Create a Circle</li>
              <li>Invite others</li>
              <li>Get what matters</li>
            </ul>
          </div>
          {getIsUserLoggedIn() ? (
            <StartCircleForm jwtToken={jwtToken} />
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

export default withRouter(StartACircle);
