import React from 'react';
import {
  render,
  RenderResult,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import type { ConfirmSignUp } from '../../../types/amplify.d';

import ConfirmEmail, { Props } from './ConfirmEmail';

const defaultProps = {
  seedEmailAddress: '',
  redirectTo: '',
  updateSeedValues: jest.fn(),
  onSuccess: jest.fn(),
  showForm: jest.fn(),
  fetchConfirmEmail: jest.fn(),
  fetchResendConfirmEmail: jest.fn(),
};

type DefaultProps = Omit<
  Props,
  'fetchInitForgotPassword' | 'fetchFinalizeForgotPassword'
>;
function renderConfirmEmail(props?: DefaultProps | Props): RenderResult {
  return render(<ConfirmEmail {...defaultProps} {...props} />);
}

describe('ConfirmEmail', () => {
  it('should render', () => {
    const { container } = renderConfirmEmail();
    expect(container).toMatchSnapshot();
  });

  describe('When given seedEmail props ', () => {
    describe('When props.seedEmail is populated', () => {
      it('Should be prefilled with the props.seedEmail', () => {
        const seedEmail = 'mike@circulate.social';
        const { queryByDisplayValue } = renderConfirmEmail({
          seedEmail,
          fetchConfirmEmail: jest.fn(),
          fetchResendConfirmEmail: jest.fn(),
        });
        const input = queryByDisplayValue(seedEmail);
        expect(input).toBeTruthy();
      });
    });
  });

  describe('Events on input', () => {
    describe('When email is inputted', () => {
      it('should call updateSeedValues with the inputted email', () => {
        const { queryByPlaceholderText } = renderConfirmEmail();
        const input = queryByPlaceholderText('joedoe@gmail.com');

        const inputtedEmail = 'mike@circulate.social';
        fireEvent.change(input, { target: { value: inputtedEmail } });

        expect(defaultProps.updateSeedValues).toHaveBeenCalledWith({
          email: inputtedEmail,
        });
      });
    });
  });

  describe('On submit of a complete form', () => {
    const fetchConfirmEmailPromise = Promise.resolve('SUCCESS') as Promise<
      ConfirmSignUp
    >;
    const fetchConfirmEmailSpy = jest.fn(() => fetchConfirmEmailPromise);

    beforeEach(() => {
      fetchConfirmEmailSpy.mockClear();
    });

    it('should call props.fetchConfirmEmailSpy with the email', async () => {
      const { queryByTestId, queryByPlaceholderText } = renderConfirmEmail({
        fetchConfirmEmail: fetchConfirmEmailSpy,
        fetchResendConfirmEmail: jest.fn(),
      });
      const emailInput = queryByPlaceholderText('joedoe@gmail.com');
      const confirmationCodeInput = queryByPlaceholderText('123456');
      const inputtedConfirmationCode = '0987';
      const inputtedEmail = '0987';

      fireEvent.change(emailInput, {
        target: { value: inputtedEmail },
      });
      fireEvent.input(confirmationCodeInput, {
        target: { value: inputtedConfirmationCode },
      });

      const submitButton = queryByTestId('submitButton');
      fireEvent.submit(submitButton);

      await waitFor(() =>
        expect(fetchConfirmEmailSpy).toHaveBeenCalledWith(
          inputtedEmail,
          inputtedConfirmationCode
        )
      );
    });

    it('Should display "Confirming" when the request is in flight', async () => {
      const {
        queryByTestId,
        queryByPlaceholderText,
        queryByText,
      } = renderConfirmEmail({
        fetchConfirmEmail: fetchConfirmEmailSpy,
        fetchResendConfirmEmail: jest.fn(),
      });
      const emailInput = queryByPlaceholderText('joedoe@gmail.com');
      const confirmationCodeInput = queryByPlaceholderText('123456');
      const inputtedConfirmationCode = '0987';
      const inputtedEmail = '0987';

      fireEvent.change(emailInput, {
        target: { value: inputtedEmail },
      });
      fireEvent.input(confirmationCodeInput, {
        target: { value: inputtedConfirmationCode },
      });

      const submitButton = queryByTestId('submitButton');
      fireEvent.submit(submitButton);

      await waitFor(() => expect(queryByText(/Confirming/i)).toBeTruthy());
    });
  });

  describe('On an incomplete form', () => {
    const fetchConfirmEmailPromise = Promise.resolve('SUCCESS') as Promise<
      ConfirmSignUp
    >;
    const fetchConfirmEmailSpy = jest.fn(() => fetchConfirmEmailPromise);
    const fetchResendConfirmEmailPromise = Promise.resolve(true);
    const fetchResendConfirmEmailSpy = jest.fn(
      () => fetchResendConfirmEmailPromise
    );

    beforeEach(() => {
      fetchConfirmEmailSpy.mockClear();
    });

    const setupIncompleteForm = (fieldsToUpdate: 'email'[]): RenderResult => {
      const container = renderConfirmEmail({
        seedEmail: '',
        fetchConfirmEmail: fetchConfirmEmailSpy,
        fetchResendConfirmEmail: fetchResendConfirmEmailSpy,
      });

      const { queryByPlaceholderText } = container;

      act(() => {
        fieldsToUpdate.forEach((fieldName) => {
          let textToQueryFor;

          switch (fieldName) {
            case 'email':
              textToQueryFor = 'joedoe@gmail.com';
              break;
            default:
              break;
          }
          const input = queryByPlaceholderText(textToQueryFor);

          fireEvent.change(input, {
            target: { value: 'SomeValueThatDoesntMatter' },
          });
        });
      });

      return container;
    };

    describe('When email field is empty', () => {
      it('should not call props.fetchRegister', async () => {
        const { queryByTestId } = setupIncompleteForm([]);

        const submitButton = queryByTestId('submitButton');
        fireEvent.submit(submitButton);
        await waitFor(() =>
          expect(fetchConfirmEmailSpy).not.toHaveBeenCalled()
        );
      });

      it('should display "Please input your email"', async () => {
        const { queryByText, queryByTestId } = setupIncompleteForm([]);
        const submitButton = queryByTestId('submitButton');
        fireEvent.submit(submitButton);

        await waitFor(() =>
          expect(queryByText(/Please input your email/i)).toBeTruthy()
        );
      });
    });
  });

  describe('When "fetchConfirmEmail" returns an error', () => {
    describe('Returning any error', () => {
      const fetchConfirmEmailPromise = Promise.resolve('SUCCESS') as Promise<
        ConfirmSignUp
      >;
      const fetchConfirmEmailSpy = jest.fn(() => fetchConfirmEmailPromise);
      const fetchResendConfirmEmailPromise = Promise.resolve(true);
      const fetchResendConfirmEmailSpy = jest.fn(
        () => fetchResendConfirmEmailPromise
      );
      const setupFormAfterSubmit = async (
        fetchConfirmEmailSpyOverride?: jest.Mock<Promise<ConfirmSignUp>>
      ): Promise<RenderResult> => {
        const container = renderConfirmEmail({
          seedEmail: '',
          fetchConfirmEmail:
            fetchConfirmEmailSpyOverride || fetchConfirmEmailSpy,
          fetchResendConfirmEmail: fetchResendConfirmEmailSpy,
        });

        const { queryByPlaceholderText, queryByTestId } = container;

        await act(() => {
          const emailInput = queryByPlaceholderText('joedoe@gmail.com');
          const confirmationCodeInput = queryByPlaceholderText('123456');

          fireEvent.change(emailInput, {
            target: { value: 'SomeValueThatDoesntMatter' },
          });
          fireEvent.change(confirmationCodeInput, {
            target: { value: '123' },
          });

          const submitButton = queryByTestId('submitButton');
          fireEvent.submit(submitButton);
        });

        return container;
      };

      beforeEach(() => {
        fetchConfirmEmailSpy.mockClear();
      });

      it('Should display an Alert telling the user that the code used is incorrect', async () => {
        const { queryByText } = await setupFormAfterSubmit(
          jest.fn(() => Promise.reject({ code: 'error' }))
        );

        await waitFor(() => {
          expect(
            queryByText(
              /Invalid verification code provided, please try again./i
            )
          ).toBeTruthy();
        });
      });
    });
  });
});
