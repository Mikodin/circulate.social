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
};

type DefaultProps = Omit<
  Props,
  'fetchInitForgotPassword' | 'fetchFinalizeForgotPassword'
>;
function renderForgotPassword(props?: DefaultProps | Props): RenderResult {
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
    const fetchInitForgotPasswordPromise = Promise.resolve(true);
    const fetchInitForgotPasswordSpy = jest.fn(
      () => fetchInitForgotPasswordPromise
    );

    beforeEach(() => {
      fetchInitForgotPasswordSpy.mockClear();
    });

    it('should call props.fetchInitForgotPasswordSpy with the email', async () => {
      const { queryByTestId, queryByPlaceholderText } = renderForgotPassword({
        seedEmail: 'aasdf',
        fetchInitForgotPassword: fetchInitForgotPasswordSpy,
      });
      const emailInput = queryByPlaceholderText('joedoe@gmail.com');

      const submitButton = queryByTestId('submitButton');

      fireEvent.change(emailInput, {
        target: { value: 'mike@circulate.social' },
      });

      fireEvent.submit(submitButton);
      await waitFor(() =>
        expect(fetchInitForgotPasswordSpy).toHaveBeenCalledWith(
          'mike@circulate.social'
        )
      );
    });

    it('Should display "Setting New Password" when the request is in flight', async () => {
      const seedEmail = 'mike@circulate.social';
      const { queryByTestId, queryByText } = renderForgotPassword({
        seedEmail,
        fetchInitForgotPassword: fetchInitForgotPasswordSpy,
      });

      const submitButton = queryByTestId('submitButton');

      fireEvent.submit(submitButton);
      await waitFor(() =>
        expect(queryByText(/Setting New Password/i)).toBeTruthy()
      );
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
});
