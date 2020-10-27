import { render, fireEvent } from '@testing-library/react';
import CircleMembers, { Props } from './CircleMembers';

const mockCircleMemberNames = ['Mike A', 'Joe T', 'Bill N'];
const DEFAULT_PROPS = {
  circleMemberNames: mockCircleMemberNames,
};

function renderContainer(overrideProps?: Partial<Props>) {
  return render(<CircleMembers {...DEFAULT_PROPS} {...overrideProps} />);
}

describe('CircleMembers', () => {
  it('Should render the h4 by default', () => {
    const container = renderContainer();
    const { queryByRole } = container;

    expect(container).toMatchSnapshot();
    expect(queryByRole('button')).toBeTruthy();
  });

  describe('When given a renderComponent', () => {
    it('Should render that component', () => {
      const container = renderContainer({
        renderComponent: <p role="custom-button">Members</p>,
      });
      const { queryByRole } = container;

      expect(container).toMatchSnapshot();
      expect(queryByRole('custom-button')).toBeTruthy();
      expect(queryByRole('button')).not.toBeTruthy();
    });
  });

  describe('When clicked', () => {
    it('Should open a Modal with the title "Members in Circle"', () => {
      const { queryByRole, queryByText } = renderContainer();
      fireEvent.click(queryByRole('button'));
      expect(queryByText('Members in Circle')).toBeTruthy();
    });
  });

  describe('The modal', () => {
    it('Should contain a list of all the members in the circle', () => {
      const { queryByRole, queryByText } = renderContainer();
      fireEvent.click(queryByRole('button'));
      mockCircleMemberNames.forEach((mockMemberName) => {
        expect(queryByText(mockMemberName)).toBeTruthy();
      });
    });
  });
});
