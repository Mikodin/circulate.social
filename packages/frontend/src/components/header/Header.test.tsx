import React from 'react';
import { render, RenderResult } from '@testing-library/react';
import UserContext, {
  UserContextType,
} from '../../state-management/UserContext';

import Header from './Header';

describe('It should pass', () => {
  it('Passes', () => {
    expect(true).toBe(true);
  });
});

function renderHeader(context?: Partial<UserContextType>): RenderResult {
  const defaultContext = {
    getIsUserLoggedIn: jest.fn(() => false),
    signOut: jest.fn(),
    signIn: jest.fn(),
    register: jest.fn(),
    confirmEmail: jest.fn(),
    resendRegisterCode: jest.fn(),
    forgotPasswordInit: jest.fn(),
    forgotPasswordSubmit: jest.fn(),
    updateUserAttributes: jest.fn(),
  };
  return render(
    <UserContext.Provider value={{ ...defaultContext, ...context }}>
      <Header />
    </UserContext.Provider>
  );
}

describe('Header', () => {
  describe('Regardless of user status', () => {
    it('Should show our logo', () => {
      const { getByText } = renderHeader();

      expect(getByText('Circulate')).toMatchInlineSnapshot(`
        <a
          href="/"
        >
          Circulate
        </a>
      `);
    });
  });
  describe('When user is signed out', () => {
    const renderSignedOutHeader = (): RenderResult =>
      renderHeader({ getIsUserLoggedIn: jest.fn(() => false) });
    it('Should match the snapshot', () => {
      const { container } = renderSignedOutHeader();
      expect(container).toMatchSnapshot();
    });

    it('Should display "Start a circle"', () => {
      const { queryByText } = renderSignedOutHeader();

      expect(queryByText('Start a circle')).toBeTruthy();
    });

    it('Should not show Logout button', () => {
      const { queryByText } = renderSignedOutHeader();

      expect(queryByText('Logout')).toBeFalsy();
    });

    it('Should not show My Circles button', () => {
      const { queryByText } = renderSignedOutHeader();

      expect(queryByText('My Circles')).toBeFalsy();
    });
  });
  describe('When user is signed in', () => {
    const renderSignedInHeader = (): RenderResult =>
      renderHeader({ getIsUserLoggedIn: jest.fn(() => true) });
    it('Should match the snapshot', () => {
      const { container } = renderSignedInHeader();
      expect(container).toMatchSnapshot();
    });

    it('Should show Logout button', () => {
      const { queryByText } = renderSignedInHeader();

      expect(queryByText('Logout')).toBeTruthy();
    });

    it('Should show My Circles button', () => {
      const { queryByText } = renderSignedInHeader();

      expect(queryByText('My Circles')).toBeTruthy();
    });

    it('Should not display "Start a circle"', () => {
      const { queryByText } = renderSignedInHeader();

      expect(queryByText('Start a circle')).toBeFalsy();
    });
  });
});
