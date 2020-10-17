import React from 'react';
import { render } from '@testing-library/react';

import { mockCircle } from '../../util/testUtils/mockModels';

import CircleActions from './CircleActionsContainer';

const mockJwtToken = 'asdf-123';

describe('CircleActionsContainer', () => {
  it('Should render all the actions', () => {
    expect(
      render(<CircleActions circle={mockCircle} jwtToken={mockJwtToken} />)
    ).toMatchSnapshot();
  });
});
