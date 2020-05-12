import React from 'react';
import { render, RenderResult } from '@testing-library/react';
// import UserContext from '../../state-management/UserContext';

import Login, { Props } from './Login';

function renderLogin(props?: Props): RenderResult {
  const defaultProps = {
    seedEmail: '',
    seedPassword: '',
    redirectTo: '',
    onSuccess: jest.fn(),
    showForm: jest.fn(),
    fetchSignIn: jest.fn(),
    updateSeedValues: jest.fn(),
  };

  return render(<Login {...defaultProps} {...props} />);
}

describe('Login', () => {
  it('should render', () => {
    const { container } = renderLogin();
    expect(container).toMatchSnapshot();
  });
});
