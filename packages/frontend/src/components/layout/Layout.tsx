import { Fragment, PropsWithChildren } from 'react';
import Head from 'next/head';

import css from './Layout.module.scss';
import Header from '../header/Header';

interface Props {
  extraWide?: boolean;
}
const Layout = (props: PropsWithChildren<Props>): JSX.Element => (
  <Fragment>
    <Head>
      <title>Circulate</title>
      <link rel="icon" href="/favicon.ico" />
    </Head>
    <Header />
    <div
      className={
        props.extraWide ? `${css.Layout} ${css.extraWide}` : css.Layout
      }
    >
      {props.children}
    </div>
  </Fragment>
);

export default Layout;
