import { PureComponent, Fragment } from 'react';

import { someFunction } from 'base-package';

import Layout from '../components/layout/Layout';
import StartCircleForm from '../page-components/start-a-circle/StartCircleForm';
import AuthContainer, {
  AUTH_FORMS,
} from '../components/authorization/AuthContainer';

import css from './start-a-circle.module.scss';
import UserContext from '../state-management/UserContext';

class StartACircle extends PureComponent<
  Record<string, unknown>,
  Record<string, unknown>
> {
  static contextType = UserContext;

  context: React.ContextType<typeof UserContext>;

  render(): JSX.Element {
    const { getIsUserLoggedIn, jwtToken } = this.context;
    console.log(someFunction());
    console.log(someFunction());
    console.log(someFunction());
    console.log(someFunction());
    return (
      <Layout>
        <div className={css.page}>
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

export default StartACircle;
