import { render, RenderResult } from '@testing-library/react';
import StartACircle from './start-a-circle';
import UserContext from '../state-management/UserContext';

const jwtTokenMock = '123-asd';
const getIsUserLoggedInMock = jest.fn(() => true);
const defaultContext = {
  jwtToken: jwtTokenMock,
  getIsUserLoggedIn: getIsUserLoggedInMock,

  // not used
  signIn: jest.fn(),
  signOut: jest.fn(),
  register: jest.fn(),
  confirmEmail: jest.fn(),
  resendRegisterCode: jest.fn(),
  forgotPasswordInit: jest.fn(),
  forgotPasswordSubmit: jest.fn(),
  updateUserAttributes: jest.fn(),
};

const renderContainer = (): RenderResult =>
  render(
    <UserContext.Provider value={{ ...defaultContext }}>
      <StartACircle />
    </UserContext.Provider>
  );

describe('StartACircle page', () => {
  describe('When the user is logged in', () => {
    beforeEach(() => {
      getIsUserLoggedInMock.mockImplementationOnce(() => true);
    });
    it('should render', () => {
      expect(renderContainer()).toMatchSnapshot();
    });

    it('It should contain the Create Circle submit button indicating that the form exists', () => {
      const { queryByText } = renderContainer();

      expect(queryByText(/Create Circle/i)).toBeTruthy();
    });
  });

  describe('When the user is not logged in', () => {
    beforeEach(() => {
      getIsUserLoggedInMock.mockImplementationOnce(() => false);
    });
    it('should render', () => {
      expect(renderContainer()).toMatchSnapshot();
    });
    it('It should prompt the user to sign in', () => {
      const { queryByText } = renderContainer();

      expect(
        queryByText(/You must be signed in to Start a Circle/i)
      ).toBeTruthy();
    });
    it('It should show the Log in form', () => {
      const { queryByText } = renderContainer();

      expect(queryByText(/Log in/i)).toBeTruthy();
    });
  });
});
