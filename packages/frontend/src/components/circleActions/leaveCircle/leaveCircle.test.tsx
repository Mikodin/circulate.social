import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { Circle } from '@circulate/types';
import axios from 'axios';

import LeaveCircle, { Props } from './LeaveCircle';
import { API_ENDPOINT } from '../../../util/constants';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockCircle = {
  id: 'someCircle',
  createdAt: '123',
  updatedAt: '123',
  members: ['dev-id'],
  createdBy: 'dev-id',
  name: 'The greatest circle',
  description: 'Great things happen here',
  frequency: 'daily',
  privacy: 'private',
} as Circle;

const mockJwtToken = 'asdf-123';

const DEFAULT_PROPS = {
  circle: mockCircle,
  jwtToken: mockJwtToken,
};
function renderLeaveCircle(overwriteProps?: Partial<Props>) {
  return render(<LeaveCircle {...DEFAULT_PROPS} {...overwriteProps} />);
}

async function renderLeaveCircleModalOpen(overwriteProps?: Partial<Props>) {
  const container = renderLeaveCircle(overwriteProps);
  const { queryByRole } = container;
  const actionButton = queryByRole('button');
  fireEvent.click(actionButton);
  return container;
}

describe('LeaveCircle', () => {
  describe('Rendering logic', () => {
    describe('When the Circle only has 1 member', () => {
      const mockCircleWithOneMemberProps = {
        circle: { ...mockCircle, members: ['dev-id'] },
      };
      it('Should display Delete Circle instead of Leave Circle', async () => {
        const { queryByText } = renderLeaveCircle(mockCircleWithOneMemberProps);

        expect(queryByText('Delete Circle')).toBeTruthy();
        expect(queryByText('Leave Circle')).toBeFalsy();
      });

      describe('When the modal is open', () => {
        it('Should display the leave text in the modal', async () => {
          const { queryByTestId } = await renderLeaveCircleModalOpen(
            mockCircleWithOneMemberProps
          );
          expect(queryByTestId('delete-text')).toBeTruthy();
          expect(queryByTestId('leave-text')).toBeFalsy();
        });
      });
    });

    describe('When the Circle has more than 1 member', () => {
      const mockCircleWithMultipleMembersProps = {
        circle: { ...mockCircle, members: ['dev-id', 'test-id'] },
      };
      it('Should display Leave Circle instead of Delete Circle', async () => {
        const { queryByText } = renderLeaveCircle(
          mockCircleWithMultipleMembersProps
        );

        expect(queryByText('Leave Circle')).toBeTruthy();
        expect(queryByText('Delete Circle')).toBeFalsy();
      });

      describe('When the modal is open', () => {
        it('Should display the leave text in the modal', async () => {
          const { queryByTestId } = await renderLeaveCircleModalOpen(
            mockCircleWithMultipleMembersProps
          );
          expect(queryByTestId('leave-text')).toBeTruthy();
          expect(queryByTestId('delete-text')).toBeFalsy();
        });
      });
    });
  });

  describe('When the initial button is clicked', () => {
    it('Should popup with a Modal', async () => {
      const container = await renderLeaveCircleModalOpen();
      const { queryByTestId } = container;
      expect(queryByTestId('leave-circle-modal')).toBeTruthy();
    });
  });

  describe('When the modal is open', () => {
    beforeEach(() => {
      mockedAxios.post.mockClear();
      mockedAxios.post.mockImplementationOnce(() => Promise.resolve({}));
    });

    describe('When the ok button is clicked', () => {
      it('Should call Axios.post with the right Circle id and jwtToken in the headers', async () => {
        const container = await renderLeaveCircleModalOpen();
        const { queryByText } = container;
        const okBtn = queryByText('OK');
        fireEvent.click(okBtn);
        expect(mockedAxios.post).toHaveBeenCalledWith(
          `${API_ENDPOINT}/circles/${mockCircle.id}/leave`,
          {},
          { headers: { Authorization: mockJwtToken } }
        );
      });
    });

    describe('When the API call fails', () => {
      test.todo('should display a message to the user');
    });
  });
});
