import React from 'react';
import {
  render,
  RenderResult,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';

import Login, { Props } from './Login';

const defaultProps = {
  seedEmail: '',
  seedPassword: '',
  redirectTo: '',
  onSuccess: jest.fn(),
  showForm: jest.fn(),
  fetchSignIn: jest.fn(),
  updateSeedValues: jest.fn(),
};

function renderLogin(props?: Props): RenderResult {
  return render(<Login {...defaultProps} {...props} />);
}

describe('Login', () => {
  it('should render', () => {
    const { container } = renderLogin();
    expect(container).toMatchSnapshot();
  });

  describe('When given seedEmail and seedPassword props ', () => {
    describe('When props.seedEmail is populated', () => {
      it('Should be prefilled with the props.seedEmail', () => {
        const seedEmail = 'mike@circulate.social';
        const { queryByDisplayValue } = renderLogin({ seedEmail });
        const input = queryByDisplayValue(seedEmail);
        expect(input).toBeTruthy();
      });
    });

    describe('When props.seedPassword is populated', () => {
      it('Should be prefilled with the props.seedPassword', () => {
        const seedPassword = 'Password1!';
        const { queryByDisplayValue } = renderLogin({ seedPassword });
        const input = queryByDisplayValue(seedPassword);
        expect(input).toBeTruthy();
      });
    });
  });

  describe('Events on input', () => {
    describe('When email is inputted', () => {
      it('should call updateSeedValues with the inputted email', () => {
        const { queryByPlaceholderText } = renderLogin();
        const input = queryByPlaceholderText('joedoe@gmail.com');

        const inputtedEmail = 'mike@circulate.social';
        fireEvent.change(input, { target: { value: inputtedEmail } });
        expect(defaultProps.updateSeedValues).toHaveBeenCalledWith({
          email: inputtedEmail,
          password: undefined,
        });
      });
    });

    describe('When password is inputted', () => {
      it('should call updateSeedValues with the inputted password', () => {
        const { queryByPlaceholderText } = renderLogin();
        const input = queryByPlaceholderText('password');

        const inputtedPassword = 'Password1!';
        fireEvent.change(input, { target: { value: inputtedPassword } });
        expect(defaultProps.updateSeedValues).toHaveBeenCalledWith({
          email: undefined,
          password: inputtedPassword,
        });
      });
    });
  });

  describe('On submit of a complete form', () => {
    const fetchSignInPromise = Promise.resolve({
      email: 'test@circulate.social',
      firstName: 'Mike',
      lastName: 'A',
    });
    const fetchSignInSpy = jest.fn(() => fetchSignInPromise);

    beforeEach(() => {
      fetchSignInSpy.mockClear();
    });

    it('should call props.fetchSignIn with the username and password', async () => {
      const { queryByTestId, queryByPlaceholderText } = renderLogin({
        seedEmail: 'aasdf',
        seedPassword: 'asdf',
        fetchSignIn: fetchSignInSpy,
      });
      const emailInput = queryByPlaceholderText('joedoe@gmail.com');
      const passwordInput = queryByPlaceholderText('password');
      const submitButton = queryByTestId('submitButton');

      fireEvent.change(emailInput, {
        target: { value: 'mike@circulate.social' },
      });
      fireEvent.change(passwordInput, { target: { value: 'Password1!' } });

      fireEvent.submit(submitButton);
      await waitFor(() =>
        expect(fetchSignInSpy).toHaveBeenCalledWith(
          'mike@circulate.social',
          'Password1!'
        )
      );
    });
    it('should allow user to click submit with seed data', async () => {
      const seedEmail = 'mike@circulate.social';
      const seedPassword = 'Password1!';

      const { queryByTestId } = renderLogin({
        seedEmail,
        seedPassword,
        fetchSignIn: fetchSignInSpy,
      });
      const submitButton = queryByTestId('submitButton');

      fireEvent.submit(submitButton);
      await waitFor(() =>
        expect(fetchSignInSpy).toHaveBeenCalledWith(seedEmail, seedPassword)
      );
    });

    it('Should display "logging in" when the request is in flight', async () => {
      const seedEmail = 'mike@circulate.social';
      const seedPassword = 'Password1!';

      const { queryByTestId, queryByText } = renderLogin({
        seedEmail,
        seedPassword,
        fetchSignIn: fetchSignInSpy,
      });
      const submitButton = queryByTestId('submitButton');

      fireEvent.submit(submitButton);
      await waitFor(() => expect(queryByText(/Logging in/i)).toBeTruthy());
    });
  });

  describe('On an incomplete form', () => {
    const fetchSignInPromise = Promise.resolve({
      email: 'test@circulate.social',
      firstName: 'Mike',
      lastName: 'A',
    });
    const fetchSignInSpy = jest.fn(() => fetchSignInPromise);

    beforeEach(() => {
      fetchSignInSpy.mockClear();
    });

    const setup = (fieldToUpdate: 'email' | 'password'): RenderResult => {
      const container = renderLogin({
        fetchSignIn: fetchSignInSpy,
      });

      const { queryByPlaceholderText } = container;

      // Fill the opposite field for the test setup
      const textToQueryFor =
        fieldToUpdate === 'email' ? 'password' : 'joedoe@gmail.com';
      const input = queryByPlaceholderText(textToQueryFor);

      act(() => {
        fireEvent.change(input, {
          target: { value: 'mike@circulate.social' },
        });
      });

      return container;
    };

    it('should not call props.fetchSignIn when email and password is empty', async () => {
      const { queryByTestId } = renderLogin({
        fetchSignIn: fetchSignInSpy,
      });

      const submitButton = queryByTestId('submitButton');

      act(() => {
        fireEvent.submit(submitButton);
      });
      await waitFor(() => expect(fetchSignInSpy).not.toHaveBeenCalled());
    });

    describe('When password field is empty', () => {
      it('should not call props.fetchSignIn when password is empty', async () => {
        const { queryByTestId } = setup('password');

        const submitButton = queryByTestId('submitButton');
        fireEvent.submit(submitButton);
        await waitFor(() => expect(fetchSignInSpy).not.toHaveBeenCalled());
      });

      it('should display "Please input your password"', async () => {
        const { queryByText, queryByTestId } = setup('password');
        const submitButton = queryByTestId('submitButton');
        fireEvent.submit(submitButton);

        await waitFor(() =>
          expect(queryByText(/Please input your password/i)).toBeTruthy()
        );
      });
    });

    describe('When email field is empty', () => {
      it('should not call props.fetchSignIn', async () => {
        const { queryByTestId } = setup('email');

        const submitButton = queryByTestId('submitButton');
        fireEvent.submit(submitButton);
        await waitFor(() => expect(fetchSignInSpy).not.toHaveBeenCalled());
      });

      it('should display "Please input your email"', async () => {
        const { queryByText, queryByTestId } = setup('email');
        const submitButton = queryByTestId('submitButton');
        fireEvent.submit(submitButton);

        await waitFor(() =>
          expect(queryByText(/Please input your email/i)).toBeTruthy()
        );
      });
    });
  });
});
