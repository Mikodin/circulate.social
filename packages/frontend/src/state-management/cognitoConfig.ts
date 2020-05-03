import { Auth } from 'aws-amplify';

function initAmplifyAuth() {
  const oauth = {
    domain: '.circulate-test2',
    scope: ['email', 'aws.cognito.signin.user.admin'],
    redirectSignIn: 'http://localhost:3000/',
    redirectSignOut: 'http://localhost:3000/',
    responseType: 'code',
  };

  const auth = Auth.configure({
    oauth,
    region: 'us-east-1',
    userPoolId: 'us-east-1_46TxJWTk9',
    userPoolWebClientId: '3bj35mgn74erbudvo6cbgd2ni3',
  });

  return auth;
}

export default initAmplifyAuth;
