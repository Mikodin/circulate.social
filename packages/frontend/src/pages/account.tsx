import { useContext } from 'react';
import { useRouter } from 'next/router';

import UserContext from '../state-management/UserContext';
import Layout from '../components/layout/Layout';
import UpdateAccountForm from '../page-components/account/UpdateAccountForm';

const Account = (): JSX.Element => {
  const { user, getIsUserLoggedIn, jwtToken } = useContext(UserContext);
  const router = useRouter();

  if (!getIsUserLoggedIn()) {
    router.push('/');
  }

  return (
    <Layout>
      {user ? (
        <>
          <UpdateAccountForm user={user} jwtToken={jwtToken} />
        </>
      ) : (
        <>
          <h2>You are not logged in.</h2>
          <p>Redirecting you somewhere safe.</p>
        </>
      )}
    </Layout>
  );
};

export default Account;
