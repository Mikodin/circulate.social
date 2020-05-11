import { useContext, Fragment } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/layout/Layout';
import AuthContainer from '../components/authorization-old/AuthContainer';
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
          <h1>What is Circulating in your world?</h1>
          <h2>Take it up a notch</h2>
          <h2>Curated content created by and for your Circle</h2>
        </div>
        {!getIsUserLoggedIn() && (
          <div className={styles.loginContainer}>
            <h2>Get in Circulation</h2>
            <AuthContainer onLoginRedirectTo="/circles/home" />
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Home;
