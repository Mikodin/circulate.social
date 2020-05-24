import { Auth } from 'aws-amplify';

function initAmplifyAuth(): void {
  const oauth = {
    domain: 'circulate',
    scope: ['email', 'aws.cognito.signin.user.admin'],
    redirectSignIn: 'http://localhost:3000/',
    redirectSignOut: 'http://localhost:3000/',
    responseType: 'code',
  };

  Auth.configure({
    oauth,
    region: 'us-east-1',
    userPoolId: 'us-east-1_80QcO55dx',
    userPoolWebClientId: '456mtbjnog3cvs92dn1ft023q5',
  });
}

export default initAmplifyAuth;
