import React from 'react';
import { render } from '@testing-library/react';
import { Circle } from '@circulate/types';

import CircleActions from './CircleActionsContainer';

const mockCircle = {
  id: 'someCircle',
  createdAt: '123',
  updatedAt: '123',
  members: ['dev-id'],
  creatorId: 'dev-id',
  name: 'The greatest circle',
  description: 'Great things happen here',
  frequency: 'daily',
  privacy: 'private',
} as Circle;

const mockJwtToken = 'asdf-123';

describe('CircleActionsContainer', () => {
  it('Should render all the actions', () => {
    expect(
      render(<CircleActions circle={mockCircle} jwtToken={mockJwtToken} />)
    ).toMatchSnapshot();
  });
});
