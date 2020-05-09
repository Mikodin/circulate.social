import { useContext, Fragment } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import UserContext from '../../state-management/UserContext';

import css from './Header.module.scss';

const Header = (): JSX.Element => {
  const { signOut, getIsUserLoggedIn } = useContext(UserContext);
  const router = useRouter();

  const signOutThenRouteIndex = async (): Promise<void> => {
    await signOut();
    router.push('/');
  };

  return (
    <Fragment>
      <div className={css.container}>
        <div className={css.logoContainer}>
          <h2>
            <Link href="/">
              <a>Circulate.social</a>
            </Link>
          </h2>
        </div>
        <div className={css.actionsContainer}>
          {getIsUserLoggedIn() ? (
            <Fragment>
              <a onClick={signOutThenRouteIndex}>Logout</a>
              <Link href="/circles/home">
                <a>My Circles</a>
              </Link>
            </Fragment>
          ) : (
            <Fragment>
              <Link href="/start-a-circle">
                <a>Start a circle</a>
              </Link>
            </Fragment>
          )}
        </div>
      </div>
    </Fragment>
  );
};

export default Header;
