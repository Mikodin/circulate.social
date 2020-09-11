import { createContext } from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars-experimental
import type CognitoUser from 'aws-amplify';
import type { ConfirmSignUp } from '../types/amplify.d';

export type UserContextType = {
  user?: {
    email: string;
    firstName: string;
    lastName: string;
  };
  userIsLoaded?: boolean;
  jwtToken?: string;
  register: (username: string, password: string) => Promise<CognitoUser>;

  confirmEmail: (
    username: string,
    code: string,
    routeOnSuccess?: string
  ) => Promise<ConfirmSignUp>;

  resendRegisterCode: (username: string) => Promise<boolean>;

  signIn: (
    username: string,
    password: string
  ) => Promise<UserContextType['user']>;

  signOut: () => Promise<boolean>;

  forgotPasswordInit: (username: string) => Promise<boolean>;

  forgotPasswordSubmit: (
    username: string,
    code: string,
    newPassword: string
  ) => Promise<boolean>;

  getIsUserLoggedIn: () => boolean;

  updateUserAttributes: (
    firstName: string,
    lastName: string
  ) => Promise<string>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export default UserContext;
