import { createContext } from 'react';
import { CognitoUser } from '@aws-amplify/auth';
import type { ConfirmSignUp } from '../types/amplify.d';

export type UserContextType = {
  user?: {
    email: string;
    firstName: string;
    lastName: string;
    timezone: string;
    id: string;
  };
  userIsLoaded?: boolean;
  jwtToken?: string;
  register: (username: string, password: string) => Promise<CognitoUser>;

  restoreUser: (bypassCache: boolean) => Promise<UserContextType['user']>;

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
    lastName: string,
    timezone: string
  ) => Promise<string>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export default UserContext;
