import { Fragment, PropsWithChildren } from 'react';
import Head from 'next/head';

import css from './Layout.module.scss';
import Header from '../header/Header';

const Layout = (
  props: PropsWithChildren<Record<string, unknown>>
): JSX.Element => (
  <Fragment>
    <Head>
      <title>Circulate</title>
      <link rel="icon" href="/favicon.ico" />
    </Head>
    <Header />
    <div className={css.Layout}>{props.children}</div>
  </Fragment>
);

export default Layout;
