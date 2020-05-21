import React from 'react';
import {
  render,
  RenderResult,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';

import Register, { Props } from './Register';

const defaultProps = {
  seedEmail: '',
  seedPassword: '',
  redirectTo: '',
  onSuccess: jest.fn(),
  showForm: jest.fn(),
  fetchRegister: jest.fn(),
  updateSeedValues: jest.fn(),
};

function renderRegister(props?: Props): RenderResult {
  return render(<Register {...defaultProps} {...props} />);
}

describe('Register', () => {
  it('should render', () => {
    const { container } = renderRegister();
    expect(container).toMatchSnapshot();
  });

  describe('When given seedEmail props ', () => {
    describe('When props.seedEmail is populated', () => {
      it('Should be prefilled with the props.seedEmail', () => {
        const seedEmail = 'mike@circulate.social';
        const { queryByDisplayValue } = renderRegister({
          seedEmail,
          fetchRegister: jest.fn(),
        });
        const input = queryByDisplayValue(seedEmail);
        expect(input).toBeTruthy();
      });
    });

    describe('When props.seedPassword is populated', () => {
      it('Should be prefilled with the props.seedPassword', () => {
        const seedPassword = 'Password1!';
        const { queryByDisplayValue } = renderRegister({
          seedPassword,
          fetchRegister: jest.fn(),
        });
        const input = queryByDisplayValue(seedPassword);
        expect(input).toBeTruthy();
      });
    });
  });

  describe('Events on input', () => {
    describe('When email is inputted', () => {
      it('should call updateSeedValues with the inputted email', () => {
        const { queryByPlaceholderText } = renderRegister();
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
        const { queryByPlaceholderText } = renderRegister();
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
    const fetchRegisterPromise = Promise.resolve({
      email: 'test@circulate.social',
      firstName: 'Mike',
      lastName: 'A',
    });
    const fetchRegisterSpy = jest.fn(() => fetchRegisterPromise);

    beforeEach(() => {
      fetchRegisterSpy.mockClear();
    });

    it('should call props.fetchRegisterSpy with the username and password', async () => {
      const { queryByTestId, queryByPlaceholderText } = renderRegister({
        seedEmail: 'aasdf',
        seedPassword: 'asdf',
        fetchRegister: fetchRegisterSpy,
      });
      const emailInput = queryByPlaceholderText('joedoe@gmail.com');
      const passwordInput = queryByPlaceholderText('Password');
      const firstNameInput = queryByPlaceholderText('John');
      const lastNameInput = queryByPlaceholderText('Doe');

      const submitButton = queryByTestId('submitButton');

      fireEvent.change(emailInput, {
        target: { value: 'mike@circulate.social' },
      });
      fireEvent.change(passwordInput, { target: { value: 'Password1!' } });
      fireEvent.change(firstNameInput, { target: { value: 'Bill' } });
      fireEvent.change(lastNameInput, { target: { value: 'Nye' } });

      fireEvent.submit(submitButton);
      await waitFor(() =>
        expect(fetchRegisterSpy).toHaveBeenCalledWith(
          'mike@circulate.social',
          'Password1!',
          'Bill',
          'Nye'
        )
      );
    });

    it('Should display "Signing up" when the request is in flight', async () => {
      const seedEmail = 'mike@circulate.social';
      const seedPassword = 'Password1!';

      const {
        queryByTestId,
        queryByText,
        queryByPlaceholderText,
      } = renderRegister({
        seedEmail,
        seedPassword,
        fetchRegister: fetchRegisterSpy,
      });

      const firstNameInput = queryByPlaceholderText('John');
      const lastNameInput = queryByPlaceholderText('Doe');
      const submitButton = queryByTestId('submitButton');

      fireEvent.change(firstNameInput, { target: { value: 'Bill' } });
      fireEvent.change(lastNameInput, { target: { value: 'Nye' } });

      fireEvent.submit(submitButton);
      await waitFor(() => expect(queryByText(/Signing up/i)).toBeTruthy());
    });
  });

  describe('On an incomplete form', () => {
    const fetchRegisterPromise = Promise.resolve({
      email: 'test@circulate.social',
      password: 'Password1!',
      firstName: 'Mike',
      lastName: 'A',
    });
    const fetchRegisterSpy = jest.fn(() => fetchRegisterPromise);

    beforeEach(() => {
      fetchRegisterSpy.mockClear();
    });

    const setupIncompleteForm = (
      fieldsToUpdate: ('email' | 'password' | 'firstName' | 'lastName')[]
    ): RenderResult => {
      const container = renderRegister({
        fetchRegister: fetchRegisterSpy,
      });

      const { queryByPlaceholderText } = container;

      act(() => {
        fieldsToUpdate.forEach((fieldName) => {
          let textToQueryFor;

          switch (fieldName) {
            case 'email':
              textToQueryFor = 'joedoe@gmail.com';
              break;
            case 'password':
              textToQueryFor = 'Password';
              break;
            case 'firstName':
              textToQueryFor = 'John';
              break;
            case 'lastName':
              textToQueryFor = 'Doe';
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

    it('should not call props.fetchRegister when email password, firstName and lastName is empty', async () => {
      const { queryByTestId } = renderRegister({
        fetchRegister: fetchRegisterSpy,
      });

      const submitButton = queryByTestId('submitButton');

      act(() => {
        fireEvent.submit(submitButton);
      });
      await waitFor(() => expect(fetchRegisterSpy).not.toHaveBeenCalled());
    });

    describe('When password field is empty', () => {
      it('should not call props.fetchRegister when password is empty', async () => {
        const { queryByTestId } = setupIncompleteForm([
          'email',
          'firstName',
          'lastName',
        ]);

        const submitButton = queryByTestId('submitButton');
        fireEvent.submit(submitButton);
        await waitFor(() => expect(fetchRegisterSpy).not.toHaveBeenCalled());
      });

      it('should display "Please input your password"', async () => {
        const { queryByText, queryByTestId } = setupIncompleteForm([
          'email',
          'firstName',
          'lastName',
        ]);
        const submitButton = queryByTestId('submitButton');
        fireEvent.submit(submitButton);

        await waitFor(() =>
          expect(queryByText(/Please input your password/i)).toBeTruthy()
        );
      });
    });

    describe('When email field is empty', () => {
      it('should not call props.fetchRegister', async () => {
        const { queryByTestId } = setupIncompleteForm([
          'password',
          'firstName',
          'lastName',
        ]);

        const submitButton = queryByTestId('submitButton');
        fireEvent.submit(submitButton);
        await waitFor(() => expect(fetchRegisterSpy).not.toHaveBeenCalled());
      });

      it('should display "Please input your email"', async () => {
        const { queryByText, queryByTestId } = setupIncompleteForm([
          'password',
          'firstName',
          'lastName',
        ]);
        const submitButton = queryByTestId('submitButton');
        fireEvent.submit(submitButton);

        await waitFor(() =>
          expect(queryByText(/Please input your email/i)).toBeTruthy()
        );
      });
    });

    describe('When firstName field is empty', () => {
      it('should not call props.fetchRegister', async () => {
        const { queryByTestId } = setupIncompleteForm([
          'email',
          'password',
          'lastName',
        ]);

        const submitButton = queryByTestId('submitButton');
        fireEvent.submit(submitButton);
        await waitFor(() => expect(fetchRegisterSpy).not.toHaveBeenCalled());
      });

      it('should display "Please input name"', async () => {
        const { queryByText, queryByTestId } = setupIncompleteForm([
          'email',
          'password',
          'lastName',
        ]);
        const submitButton = queryByTestId('submitButton');
        fireEvent.submit(submitButton);

        await waitFor(() =>
          expect(queryByText(/Please input name/i)).toBeTruthy()
        );
      });
    });

    describe('When lastName field is empty', () => {
      it('should not call props.fetchRegister', async () => {
        const { queryByTestId } = setupIncompleteForm([
          'email',
          'password',
          'firstName',
        ]);

        const submitButton = queryByTestId('submitButton');
        fireEvent.submit(submitButton);
        await waitFor(() => expect(fetchRegisterSpy).not.toHaveBeenCalled());
      });

      it('should display "Please input your last name"', async () => {
        const { queryByText, queryByTestId } = setupIncompleteForm([
          'email',
          'password',
          'firstName',
        ]);
        const submitButton = queryByTestId('submitButton');
        fireEvent.submit(submitButton);

        await waitFor(() =>
          expect(queryByText(/Please input your last name/i)).toBeTruthy()
        );
      });
    });
  });
});
