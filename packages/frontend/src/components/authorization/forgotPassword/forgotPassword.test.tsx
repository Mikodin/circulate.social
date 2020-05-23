import React from 'react';
import {
  render,
  RenderResult,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';

import ForgotPassword, { Props } from './ForgotPassword';

const defaultProps = {
  seedEmail: '',
  redirectTo: '',
  onSuccess: jest.fn(),
  showForm: jest.fn(),
  updateSeedValues: jest.fn(),
  fetchInitForgotPassword: jest.fn(),
  fetchFinalizeForgotPassword: jest.fn(),
  onFormCompletionCallback: jest.fn(),
};

function renderForgotPassword(props?: Partial<Props>): RenderResult {
  return render(<ForgotPassword {...defaultProps} {...props} />);
}

describe('ForgotPassword', () => {
  it('should render', () => {
    const { container } = renderForgotPassword();
    expect(container).toMatchSnapshot();
  });

  describe('When given seedEmail props ', () => {
    describe('When props.seedEmail is populated', () => {
      it('Should be prefilled with the props.seedEmail', () => {
        const seedEmail = 'mike@circulate.social';
        const { queryByDisplayValue } = renderForgotPassword({
          seedEmail,
        });
        const input = queryByDisplayValue(seedEmail);
        expect(input).toBeTruthy();
      });
    });
  });

  describe('Events on input', () => {
    describe('When email is inputted', () => {
      it('should call updateSeedValues with the inputted email', () => {
        const { queryByPlaceholderText } = renderForgotPassword();
        const input = queryByPlaceholderText('joedoe@gmail.com');

        const inputtedEmail = 'mike@circulate.social';
        fireEvent.change(input, { target: { value: inputtedEmail } });

        expect(defaultProps.updateSeedValues).toHaveBeenCalledWith({
          email: inputtedEmail,
          password: undefined,
        });
      });
    });
  });

  describe('On submit of a complete form', () => {
    const fetchInitForgotPasswordSpy = jest.fn(() => Promise.resolve(true));
    const fetchFinalizeForgotPasswordSpy = jest.fn(() => Promise.resolve(true));
    const onFormCompletionCallbackSpy = jest.fn();
    beforeEach(() => {
      fetchInitForgotPasswordSpy.mockClear();
      fetchFinalizeForgotPasswordSpy.mockClear();
    });

    const setupCompleteForm = async (
      waitForFetchInitForgotPasswordToFinish: boolean
    ): Promise<RenderResult> => {
      const container = renderForgotPassword({
        seedEmail: 'aasdf',
        fetchInitForgotPassword: fetchInitForgotPasswordSpy,
        fetchFinalizeForgotPassword: fetchFinalizeForgotPasswordSpy,
        onFormCompletionCallback: onFormCompletionCallbackSpy,
      });
      const { queryByTestId, queryByPlaceholderText } = container;
      const emailInput = queryByPlaceholderText('joedoe@gmail.com');

      const submitButton = queryByTestId('submitButton');

      if (waitForFetchInitForgotPasswordToFinish) {
        await act(async () => {
          fireEvent.change(emailInput, {
            target: { value: 'mike@circulate.social' },
          });

          fireEvent.submit(submitButton);
        });
      } else {
        act(() => {
          fireEvent.change(emailInput, {
            target: { value: 'mike@circulate.social' },
          });

          fireEvent.submit(submitButton);
        });
      }

      return container;
    };

    describe('On submit of first step just email form', () => {
      it('should call props.fetchInitForgotPasswordSpy with the email', async () => {
        await setupCompleteForm(false);
        await waitFor(() =>
          expect(fetchInitForgotPasswordSpy).toHaveBeenCalledWith(
            'mike@circulate.social'
          )
        );
      });

      it('Should display "Submitting..." when the request is in flight', async () => {
        const { queryByText } = await setupCompleteForm(false);
        await waitFor(() => expect(queryByText(/Submitting.../i)).toBeTruthy());
      });
    });

    describe('On step 2 confirming code and setting new password', () => {
      const emailInputValue = 'mike@circulate.social';
      const newPasswordValue = 'newPass1!';
      const confirmationCodeValue = '09876';

      const setupCompleteStep2Form = async (): Promise<RenderResult> => {
        const step2FormContainer = await setupCompleteForm(true);
        const { queryByTestId, queryByPlaceholderText } = step2FormContainer;
        const newPasswordInput = queryByPlaceholderText('Password');
        const confirmationCodeInput = queryByPlaceholderText('123456');
        const submitButton = queryByTestId('submitButton');

        await act(async () => {
          fireEvent.change(newPasswordInput, {
            target: { value: newPasswordValue },
          });
          fireEvent.change(confirmationCodeInput, {
            target: { value: confirmationCodeValue },
          });

          fireEvent.submit(submitButton);
        });
        return step2FormContainer;
      };

      it('Should display the new password and confirmation code form with email already filled', async () => {
        const {
          queryByPlaceholderText,
          queryByDisplayValue,
        } = await setupCompleteForm(true);

        expect(queryByDisplayValue(emailInputValue)).toBeTruthy();
        expect(queryByPlaceholderText('Password')).toBeTruthy();
        expect(queryByPlaceholderText('123456')).toBeTruthy();
      });

      describe('On submit of a filled new password and confirmation form', () => {
        it('Should fire fetchFinalizeForgotPassword with the email, new password and confirmation code', async () => {
          await setupCompleteStep2Form();

          await waitFor(() =>
            expect(fetchFinalizeForgotPasswordSpy).toHaveBeenCalledWith(
              emailInputValue,
              confirmationCodeValue,
              newPasswordValue
            )
          );
        });
      });

      it('Should fire props.onFormCompletionCallback with the email, and new password', async () => {
        await setupCompleteStep2Form();
        await waitFor(() =>
          expect(onFormCompletionCallbackSpy).toHaveBeenCalledWith({
            email: emailInputValue,
            password: newPasswordValue,
          })
        );
      });
    });
  });

  describe('On an incomplete form', () => {
    const fetchInitForgotPasswordPromise = Promise.resolve(true);
    const fetchInitForgotPasswordSpy = jest.fn(
      () => fetchInitForgotPasswordPromise
    );

    beforeEach(() => {
      fetchInitForgotPasswordSpy.mockClear();
    });

    const setupIncompleteForm = (fieldsToUpdate: 'email'[]): RenderResult => {
      const container = renderForgotPassword({
        seedEmail: '',
        fetchInitForgotPassword: fetchInitForgotPasswordSpy,
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
          expect(fetchInitForgotPasswordSpy).not.toHaveBeenCalled()
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

  // TODO Return to this
  describe.skip('When API requests go wrong', () => {
    const setupFormAfterFirstSubmit = async (
      fetchInitForgotPasswordMockOverride?: jest.Mock<Promise<boolean>, []>
    ): Promise<RenderResult> => {
      const fetchInitForgotPasswordMock = jest.fn(() => Promise.resolve(true));
      const container = renderForgotPassword({
        seedEmail: 'aasdf',
        fetchInitForgotPassword:
          fetchInitForgotPasswordMock || fetchInitForgotPasswordMockOverride,
      });
      const { queryByTestId, queryByPlaceholderText } = container;
      const emailInput = queryByPlaceholderText('joedoe@gmail.com');

      const submitButton = queryByTestId('submitButton');

      act(() => {
        fireEvent.change(emailInput, {
          target: { value: 'mike@circulate.social' },
        });

        fireEvent.submit(submitButton);
      });

      return container;
    };

    describe('When the user tries to forgotPassword too many times', () => {
      it('Should display a limit error to the use', async () => {
        const limitExceededExceptionMock = jest.fn(() =>
          Promise.reject({ code: 'LimitExceededException' })
        );
        const { queryByText } = await setupFormAfterFirstSubmit(
          limitExceededExceptionMock
        );

        await waitFor(() => {
          expect(limitExceededExceptionMock).toBeCalledWith('as');
          expect(
            queryByText(/Attempt limit exceeded, please try after some time./)
          ).toBeTruthy();
        });
      });
    });
    describe('First form error states', () => {
      it('Should display a limit error to the use', async () => {
        const limitExceededExceptionMock = jest.fn(() =>
          Promise.reject({ code: 'CodeMismatchException' })
        );
        const { queryByText } = await setupFormAfterFirstSubmit(
          limitExceededExceptionMock
        );

        await waitFor(() => {
          expect(limitExceededExceptionMock).toBeCalledWith('as');
          expect(
            queryByText(/Attempt limit exceeded, please try after some time./)
          ).toBeTruthy();
        });
      });
    });
  });
});
