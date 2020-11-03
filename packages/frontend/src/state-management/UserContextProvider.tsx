import React, { Component } from 'react';
import { Auth } from 'aws-amplify';

import { CognitoUser } from '@aws-amplify/auth';
import type {
  CurrentAuthenticatedUser,
  ForgotPassword,
  ConfirmSignUp,
} from '../types/amplify.d';

import UserContext, { UserContextType } from './UserContext';
import initAmplifyAuth from './cognitoConfig';

type Props = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  children: any;
};

type State = {
  user?: {
    email: string;
    firstName: string;
    lastName: string;
  };
  cognitoUser?: CognitoUser;
  userIsLoaded?: boolean;
  jwtToken?: string;
};

class UserContextProvider extends Component<Props, State> {
  state: State = {
    user: undefined,
    userIsLoaded: false,
    jwtToken: undefined,
  };

  async componentDidMount(): Promise<void> {
    initAmplifyAuth();
    try {
      await this.restoreSession();
      await this.restoreUser();
    } catch (error) {
      console.error(error);
    }
  }

  register = async (
    username: string,
    password: string
  ): Promise<CognitoUser> => {
    try {
      const results = await Auth.signUp({
        username,
        password,
      });

      this.setState({ cognitoUser: results.user });
      return results.user;
    } catch (error) {
      console.error('register', error);
      throw error;
    }
  };

  updateUserAttributes = async (
    firstName: string,
    lastName: string,
    timezone: string
  ): Promise<string> => {
    const { cognitoUser } = this.state;
    try {
      let resp = '';
      if (cognitoUser) {
        resp = await Auth.updateUserAttributes(cognitoUser, {
          'custom:first_name': firstName,
          'custom:last_name': lastName,
          'custom:time_zone': timezone,
        });

        this.setState({
          user: {
            ...this.state.user,
            firstName,
            lastName,
          },
        });
      }

      return resp;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  confirmEmail = async (
    username: string,
    code: string,
    routeOnSuccess?: string
  ): Promise<ConfirmSignUp> => {
    try {
      const auth: ConfirmSignUp = await Auth.confirmSignUp(username, code);
      if (routeOnSuccess) {
        console.error(routeOnSuccess);
      }
      return auth;
    } catch (error) {
      console.error('confirmEmail', error);
      throw error;
    }
  };

  resendRegisterCode = async (username: string): Promise<boolean> => {
    try {
      // type is ../../types/amplify.d.ts.ResendSignUp
      const resendSignUp = await Auth.resendSignUp(username);
      return Boolean(resendSignUp);
    } catch (error) {
      console.error('resendRegisterCode', error);
      throw error;
    }
  };

  signIn = async (
    username: string,
    password: string
  ): Promise<UserContextType['user']> => {
    try {
      const cognitoUser = await Auth.signIn({
        username,
        password,
      });
      const { attributes } = cognitoUser;
      const userInfo = attributes && {
        firstName: attributes.given_name,
        lastName: attributes.family_name,
        email: attributes.email,
        id: attributes.sub,
      };

      await this.restoreSession();
      this.setState({
        user: userInfo,
        cognitoUser,
      });

      return userInfo;
    } catch (error) {
      console.error('signIn', error);

      throw error;
    }
  };

  signOut = async (): Promise<boolean> => {
    try {
      await Auth.signOut();
      this.setState({
        user: null,
        userIsLoaded: true,
        jwtToken: null,
      });
      return true;
    } catch (error) {
      console.error('signOut', error);
      throw error;
    }
  };

  restoreSession = async (): Promise<string> => {
    try {
      const userSession = await Auth.currentSession();
      const jwtToken = userSession.getIdToken().getJwtToken();
      this.setState({ userIsLoaded: true, jwtToken });
      return jwtToken;
    } catch (error) {
      console.error('restoreSession', error);
      return error;
    }
  };

  restoreUser = async (): Promise<UserContextType['user']> => {
    try {
      const currentAuthenticatedUser: CurrentAuthenticatedUser = await Auth.currentAuthenticatedUser();
      const { attributes } = currentAuthenticatedUser;
      const user = {
        firstName: attributes.given_name,
        lastName: attributes.family_name,
        email: attributes.email,
        id: attributes.sub,
      };
      this.setState({
        user,
        userIsLoaded: true,
      });

      return user;
    } catch (error) {
      console.error('restoreUser', error);
      if (error === 'not authenticated') {
        this.setState({
          userIsLoaded: true,
        });
      }
      return error;
    }
  };

  forgotPasswordInit = async (username: string): Promise<boolean> => {
    try {
      const sent: ForgotPassword = await Auth.forgotPassword(username);
      return Boolean(sent.CodeDeliveryDetails);
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  forgotPasswordSubmit = async (
    username: string,
    code: string,
    newPassword: string
  ): Promise<boolean> => {
    try {
      const sent = await Auth.forgotPasswordSubmit(username, code, newPassword);
      return Boolean(sent);
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  getIsUserLoggedIn = (): boolean => {
    const { userIsLoaded, jwtToken } = this.state;
    return Boolean(userIsLoaded && jwtToken);
  };

  render(): JSX.Element {
    const { userIsLoaded } = this.state;

    return userIsLoaded ? (
      <div>
        <UserContext.Provider
          value={{
            ...this.state,
            signIn: this.signIn,
            signOut: this.signOut,
            register: this.register,
            confirmEmail: this.confirmEmail,
            resendRegisterCode: this.resendRegisterCode,
            forgotPasswordInit: this.forgotPasswordInit,
            forgotPasswordSubmit: this.forgotPasswordSubmit,
            getIsUserLoggedIn: this.getIsUserLoggedIn,
            updateUserAttributes: this.updateUserAttributes,
          }}
        >
          {this.props.children}
        </UserContext.Provider>
      </div>
    ) : (
      <div></div>
    );
  }
}

export default UserContextProvider;
