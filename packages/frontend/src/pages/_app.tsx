import React, { Fragment } from 'react';
import App from 'next/app';
import { withRouter } from 'next/router';
import Head from 'next/head';
import { Auth } from 'aws-amplify';
import 'antd/dist/antd.css'; // or 'antd/dist/antd.less'
import '../styles.scss';

import UserContext from '../state-management/UserContext';
import initAmplifyAuth from '../state-management/cognitoConfig';

type State = {
  user: {
    email: string;
    firstName: string;
    lastName: string;
  } | null;
  userIsLoaded: boolean;
  jwtToken: string | null;
};
class MyApp extends App<{}, State> {
  state = {
    user: null,
    userIsLoaded: false,
    jwtToken: null,
  };

  async componentDidMount(): Promise<void> {
    initAmplifyAuth();
    await this.restoreSession();
    await this.restoreUser();
  }

  // eslint-disable-next-line
  register = async (
    username: string,
    password: string,
    firstName: string,
    lastName: string
  ) => {
    try {
      const auth = await Auth.signUp({
        username,
        password,
        attributes: {
          // eslint-disable-next-line @typescript-eslint/camelcase
          given_name: firstName,
          // eslint-disable-next-line @typescript-eslint/camelcase
          family_name: lastName,
        },
      });

      const user = {
        email: username,
        firstName,
        lastName,
      };

      this.setState({ user });
      return auth;
    } catch (error) {
      console.error('register', error);
      if (error.code === 'UsernameExistsException') {
        alert(`register: A user with this email already exists`);
      }

      throw error;
    }
  };

  confirmEmail = async (
    username: string,
    code: string,
    routeOnSuccess?: string
    // @TODO type this
    // eslint-disable-next-line
  ): Promise<any> => {
    try {
      const auth = await Auth.confirmSignUp(username, code);
      if (routeOnSuccess) {
        this.props.router.push(routeOnSuccess);
      }
      return auth;
    } catch (error) {
      console.error('confirmEmail', error);
      if (error.code !== 'CodeMismatchException') {
        alert(`confirmEmail: ${error.message}`);
      }
      throw error;
    }
  };

  resendRegisterCode = async (username: string): Promise<boolean> => {
    try {
      await Auth.resendSignUp(username);
      return true;
    } catch (error) {
      console.error('resendRegisterCode', error);
      return error;
    }
  };

  // @TODO type this
  // eslint-disable-next-line
  signIn = async (username: string, password: string) => {
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
      };
      await this.restoreSession();
      this.setState({
        user: userInfo,
      });

      return cognitoUser;
    } catch (error) {
      console.error('signIn', error);
      if (error.code === 'UserNotConfirmedException') {
        alert(`signIn: ${error.message}`);
      }
      throw error;
    }
  };

  // @TODO type this
  // eslint-disable-next-line
  signOut = async (): Promise<any> => {
    try {
      const auth = await Auth.signOut();
      this.setState({
        user: null,
        userIsLoaded: true,
        jwtToken: null,
      });
      this.props.router.push('/');
      return auth;
    } catch (error) {
      console.error('signOut', error);
      throw error;
    }
  };

  restoreSession = async (): Promise<void> => {
    try {
      const userSession = await Auth.currentSession();
      const jwtToken = userSession.getIdToken().getJwtToken();
      this.setState({ userIsLoaded: true, jwtToken });
    } catch (error) {
      console.error('restoreSession', error);
    }
  };

  restoreUser = async (): Promise<void> => {
    try {
      const user = await Auth.currentAuthenticatedUser();
      this.setState({
        user,
        userIsLoaded: true,
      });
    } catch (error) {
      console.error('restoreUser', error);
      if (error === 'not authenticated') {
        this.setState({
          userIsLoaded: true,
        });
      }
    }
  };

  // @TODO type this
  // eslint-disable-next-line
  forgotPasswordInit = async (username: string): Promise<any> => {
    try {
      const sent = await Auth.forgotPassword(username);
      return sent;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  forgotPasswordSubmit = async (
    username: string,
    code: string,
    newPassword: string
    // @TODO type this
    // eslint-disable-next-line
  ): Promise<any> => {
    try {
      const sent = await Auth.forgotPasswordSubmit(username, code, newPassword);
      return sent;
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
    const { Component, pageProps } = this.props;
    const { userIsLoaded } = this.state;

    return userIsLoaded ? (
      <Fragment>
        <Head>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
        </Head>
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
          }}
        >
          <Component {...pageProps} />
        </UserContext.Provider>
      </Fragment>
    ) : (
      <Fragment></Fragment>
    );
  }
}

export default withRouter(MyApp);
