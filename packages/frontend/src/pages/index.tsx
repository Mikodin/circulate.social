import { useContext, Fragment } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/layout/Layout';
import AuthContainer from '../components/authorization/AuthContainer';
import styles from './index.module.scss';
import UserContext from '../state-management/UserContext';

const Home = (): JSX.Element => {
  const { getIsUserLoggedIn } = useContext(UserContext);
  const router = useRouter();
  if (getIsUserLoggedIn()) {
    router.push('/circles/home');
    return <Fragment></Fragment>;
  }
  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.infoContainer}>
          <h1>A collaborative newsletter platform.</h1>
          <h2>
            Designed to empower communities of all sizes to quickly collect and
            share curated content.
          </h2>
          <h2>All delivered as one relevant email digest.</h2>
        </div>
        {!getIsUserLoggedIn() && (
          <div className={styles.authContainer}>
            <AuthContainer
              onLoginRedirectTo="/circles/home"
              onConfirmEmailRedirectTo="/start-a-circle"
              onForgotPasswordRedirectTo="/circles/home"
            />
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Home;
