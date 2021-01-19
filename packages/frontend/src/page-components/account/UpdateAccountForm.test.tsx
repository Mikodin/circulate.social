import { render } from '@testing-library/react';
// import axios from 'axios';

import UpdateAccountForm, { Props } from './UpdateAccountForm';
import { mockUser } from '../../util/testUtils/mockModels';

const DEFAULT_PROPS: Props = {
  user: mockUser,
  jwtToken: 'some_token',
  refreshUser: () => Promise.resolve(mockUser),
};
function renderUpdateAccountForm(overrideProps?: Partial<Props>) {
  return render(<UpdateAccountForm {...DEFAULT_PROPS} {...overrideProps} />);
}

describe('UpdateAccountForm', () => {
  it('Should exist', () => {
    expect(renderUpdateAccountForm()).toMatchSnapshot();
  });
});
