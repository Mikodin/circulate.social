import React from 'react';
import {
  render,
  RenderResult,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';

import Login, { Props } from './Login';
import { AUTH_FORMS } from '../AuthContainer';

const defaultProps = {
  seedEmail: '',
  seedPassword: '',
  redirectTo: '',
  onSuccess: jest.fn(),
  showForm: jest.fn(),
  fetchSignIn: jest.fn(),
  updateSeedValues: jest.fn(),
  onFormCompletionCallback: jest.fn(),
};

function renderLogin(props?: Partial<Props>): RenderResult {
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
        const input = queryByPlaceholderText('Password');

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
    const inputtedEmailValue = 'test@circulate.social';
    const inputtedPasswordValue = 'Password1!';
    const fetchSignInSpy = jest.fn(() =>
      Promise.resolve({
        email: inputtedEmailValue,
        firstName: 'Bill',
        lastName: 'Nye',
      })
    );

    const onFormCompletionCallbackSpy = jest.fn(() => Promise.resolve());

    beforeEach(() => {
      fetchSignInSpy.mockClear();
      onFormCompletionCallbackSpy.mockClear();
    });

    const setupCompleteForm = (): RenderResult => {
      const container = renderLogin({
        seedEmail: 'aasdf',
        seedPassword: 'asdf',
        fetchSignIn: fetchSignInSpy,
        onFormCompletionCallback: onFormCompletionCallbackSpy,
      });
      const { queryByTestId, queryByPlaceholderText } = container;
      const emailInput = queryByPlaceholderText('joedoe@gmail.com');
      const passwordInput = queryByPlaceholderText('Password');
      const submitButton = queryByTestId('submitButton');

      act(() => {
        fireEvent.change(emailInput, {
          target: { value: inputtedEmailValue },
        });
        fireEvent.change(passwordInput, {
          target: { value: inputtedPasswordValue },
        });

        fireEvent.submit(submitButton);
      });
      return container;
    };

    it('should call props.fetchSignIn with the username and password', async () => {
      setupCompleteForm();
      await waitFor(() =>
        expect(fetchSignInSpy).toHaveBeenCalledWith(
          inputtedEmailValue,
          inputtedPasswordValue
        )
      );
    });

    it('should call props.onFormCompletionCallback with the username and password', async () => {
      setupCompleteForm();
      await waitFor(() =>
        expect(onFormCompletionCallbackSpy).toHaveBeenCalledWith({
          email: inputtedEmailValue,
          password: inputtedPasswordValue,
        })
      );
    });

    it('Should display "logging in" when the request is in flight', async () => {
      const { queryByText } = setupCompleteForm();
      await waitFor(() => expect(queryByText(/Logging in/i)).toBeTruthy());
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

    const setupIncompleteForm = (
      fieldToUpdate: 'email' | 'password'
    ): RenderResult => {
      const container = renderLogin({
        fetchSignIn: fetchSignInSpy,
      });

      const { queryByPlaceholderText, queryByTestId } = container;

      // Fill the opposite field for the test setup
      const textToQueryFor =
        fieldToUpdate === 'email' ? 'Password' : 'joedoe@gmail.com';
      const input = queryByPlaceholderText(textToQueryFor);
      const submitButton = queryByTestId('submitButton');

      act(() => {
        fireEvent.change(input, {
          target: { value: 'mike@circulate.social' },
        });

        fireEvent.submit(submitButton);
      });

      return container;
    };

    it('should not call props.fetchSignIn when email and password is empty', async () => {
      renderLogin({
        fetchSignIn: fetchSignInSpy,
      });

      await waitFor(() => expect(fetchSignInSpy).not.toHaveBeenCalled());
    });

    describe('When password field is empty', () => {
      it('should not call props.fetchSignIn when password is empty', async () => {
        setupIncompleteForm('password');
        await waitFor(() => expect(fetchSignInSpy).not.toHaveBeenCalled());
      });

      it('should display "Please input your password"', async () => {
        const { queryByText } = setupIncompleteForm('password');

        await waitFor(() =>
          expect(queryByText(/Please input your password/i)).toBeTruthy()
        );
      });
    });

    describe('When email field is empty', () => {
      it('should not call props.fetchSignIn', async () => {
        setupIncompleteForm('email');

        await waitFor(() => expect(fetchSignInSpy).not.toHaveBeenCalled());
      });

      it('should display "Please input your email"', async () => {
        const { queryByText } = setupIncompleteForm('email');

        await waitFor(() =>
          expect(queryByText(/Please input your email/i)).toBeTruthy()
        );
      });
    });
  });

  describe('Login returning any error', () => {
    const fetchSignInPromise = Promise.resolve({
      email: 'test@circulate.social',
      firstName: 'Mike',
      lastName: 'A',
    });
    const fetchSignInSpy = jest.fn(() => fetchSignInPromise);

    const setupFormAfterSubmit = async (
      fetchSignInSpyOverride?: typeof fetchSignInSpy,
      showFormOverride?: jest.Mock<Props['showForm']>
    ): Promise<RenderResult> => {
      const container = renderLogin({
        fetchSignIn: fetchSignInSpyOverride || fetchSignInSpy,
        showForm: showFormOverride,
      });

      const { queryByPlaceholderText, queryByTestId } = container;

      await act(async () => {
        const emailInput = queryByPlaceholderText('joedoe@gmail.com');
        const passwordInput = queryByPlaceholderText('Password');

        fireEvent.change(emailInput, {
          target: { value: 'email@email.com' },
        });
        fireEvent.change(passwordInput, {
          target: { value: 'Password1!' },
        });

        const submitButton = queryByTestId('submitButton');
        fireEvent.submit(submitButton);
      });

      return container;
    };

    beforeEach(() => {
      fetchSignInSpy.mockClear();
    });

    describe('When username or password is incorrect', () => {
      const fetchSignInInvalidPasswordMock = jest.fn(() =>
        Promise.reject({ code: 'NotAuthorizedException' })
      );
      it('Should display an Alert telling the user that the username or password is incorrect', async () => {
        const { queryByText } = await setupFormAfterSubmit(
          fetchSignInInvalidPasswordMock
        );

        await waitFor(() => {
          expect(queryByText(/Invalid username or password/i)).toBeTruthy();
        });
      });

      // TODO figure out why this test won't work
      describe.skip('When the user inputs text in the email field', () => {
        it('should clear the alert', async () => {
          const {
            queryByText,
            queryByPlaceholderText,
          } = await setupFormAfterSubmit(fetchSignInInvalidPasswordMock);

          act(() => {
            const emailInput = queryByPlaceholderText('joedoe@gmail.com');

            fireEvent.change(emailInput, {
              target: { value: 'email@email.com' },
            });
          });

          await waitFor(() =>
            expect(
              queryByText(/Invalid username or password/i)
            ).not.toBeTruthy()
          );
        });
      });
    });

    describe('When user has not verified their account', () => {
      const fetchSignInUserNotConfirmedMock = jest.fn(() =>
        Promise.reject({ code: 'UserNotConfirmedException' })
      );

      const showFormMock = jest.fn();

      it('Should call props.showForm(AUTH_FORMS.confirmEmail)', async () => {
        await setupFormAfterSubmit(
          fetchSignInUserNotConfirmedMock,
          showFormMock
        );

        await waitFor(() => {
          expect(showFormMock).toHaveBeenCalledWith(AUTH_FORMS.confirmEmail);
        });
      });
    });

    describe('When user receives a NetworkError from fetchSignIn', () => {
      const fetchSignInNetworkErrorMock = jest.fn(() =>
        Promise.reject({ code: 'NetworkError' })
      );

      const showFormMock = jest.fn();

      it("Should display an alert telling them that we couldn't connect", async () => {
        const { queryByText } = await setupFormAfterSubmit(
          fetchSignInNetworkErrorMock,
          showFormMock
        );

        await waitFor(() => {
          expect(
            queryByText(
              /Sorry, we couldn't connect to our server. Please try again./i
            )
          ).toBeTruthy();
        });
      });
    });

    describe('When user receives an Unknown error from fetchSignIn', () => {
      const fetchSignInNetworkErrorMock = jest.fn(() =>
        Promise.reject({ code: 'Unknown' })
      );

      it('Should display an alert telling them to try again', async () => {
        const { queryByText } = await setupFormAfterSubmit(
          fetchSignInNetworkErrorMock
        );

        await waitFor(() => {
          expect(
            queryByText(
              'Sorry, something unknown went wrong. Please try again.'
            )
          ).toBeTruthy();
        });
      });
    });
  });
});
