import React, { Fragment } from 'react';
import App from 'next/app';
import { withRouter } from 'next/router';
import Head from 'next/head';
import UserContextProvider from '../state-management/UserContextProvider';

import 'antd/dist/antd.css';
import '../styles.scss';

class MyApp extends App<{}, {}> {
  render(): JSX.Element {
    const { Component, pageProps } = this.props;

    return (
      <Fragment>
        <Head>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
        </Head>
        <UserContextProvider>
          <Component {...pageProps} />
        </UserContextProvider>
      </Fragment>
    );
  }
}

export default withRouter(MyApp);
