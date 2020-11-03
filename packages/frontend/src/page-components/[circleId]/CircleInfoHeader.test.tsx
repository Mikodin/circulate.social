import { render, RenderResult } from '@testing-library/react';
import { Circle, CirclePreview } from '@circulate/types';

import CircleInfoHeader, { Props } from './CircleInfoHeader';

const mockCircle = {
  id: 'asdf-123',
  createdAt: '1234',
  updatedAt: '12345',
  members: ['Mike A', 'Bill Nye'],
  createdBy: '1234-asdf',
  name: 'The greatest Circle ever',
  description: 'A circle for amazing things',
  content: ['content-1', 'content-2'],
  frequency: 'weekly' as const,
  privacy: 'private' as const,
} as Circle;

const mockCirclePreview = {
  circleId: 'asdf-123',
  createdAt: '1234',
  updatedAt: '12345',
  memberNames: ['Mike A', 'Bill Nye'],
  creatorName: '1234-asdf',
  name: 'The greatest Circle ever',
  description: 'A circle for amazing things',
  totalContentCount: 2,
  frequency: 'weekly' as const,
  privacy: 'private' as const,
} as CirclePreview;

const DEFAULT_PROPS = {
  circle: mockCircle,
  isLoading: false,
  jwtToken: 'some-token',
};

function renderCircleInfoHeader(props?: Partial<Props>): RenderResult {
  return render(<CircleInfoHeader {...DEFAULT_PROPS} {...props} />);
}

describe('CircleInfoHeader', () => {
  it('Should render', () => {
    expect(renderCircleInfoHeader()).toMatchSnapshot();
  });

  describe('When given a Circle', () => {
    it('Should contain any CircleActions', () => {
      const { queryByText } = renderCircleInfoHeader();
      expect(queryByText(/Invite/i)).toBeTruthy();
    });
    it('Should contain the count of content under Posts', () => {
      const { queryByText } = renderCircleInfoHeader();
      expect(queryByText(/Posts: 2/i)).toBeTruthy();
    });
    it('Should contain the count of Members', () => {
      const { queryByText } = renderCircleInfoHeader();
      expect(queryByText(/Members: 2/i)).toBeTruthy();
    });
    it('Should contain the description from the Circle', () => {
      const { queryByText } = renderCircleInfoHeader();
      expect(queryByText(DEFAULT_PROPS.circle.description)).toBeTruthy();
    });
    it('Should contain the frequency that the Circle sends with', () => {
      const { queryByText } = renderCircleInfoHeader();
      expect(queryByText(/Weekly/i)).toBeTruthy();
    });

    describe('When Circle has no description', () => {
      it('Should not contain the description from the Circle if there is no description', () => {
        const { queryByText } = renderCircleInfoHeader({
          circle: { ...DEFAULT_PROPS.circle, description: undefined },
        });
        expect(queryByText(/Description/i)).toBeFalsy();
      });
    });
  });

  describe('When given a CirclePreview', () => {
    const mockCirclePreviewPropOverrides = {
      circle: undefined,
      circlePreview: mockCirclePreview,
    };
    it('Should not contain any CircleActions', () => {
      const { queryByText } = renderCircleInfoHeader(
        mockCirclePreviewPropOverrides
      );
      expect(queryByText(/Invite/i)).toBeFalsy();
    });
    it('Should contain the count of content under Posts', () => {
      const { queryByText } = renderCircleInfoHeader(
        mockCirclePreviewPropOverrides
      );
      expect(queryByText(/Posts: 2/i)).toBeTruthy();
    });
    it('Should contain the count of Members', () => {
      const { queryByText } = renderCircleInfoHeader(
        mockCirclePreviewPropOverrides
      );
      expect(queryByText(/Members: 2/i)).toBeTruthy();
    });
    it('Should contain the description from the Circle', () => {
      const { queryByText } = renderCircleInfoHeader(
        mockCirclePreviewPropOverrides
      );
      expect(queryByText(DEFAULT_PROPS.circle.description)).toBeTruthy();
    });
    it('Should contain the frequency that the Circle sends with', () => {
      const { queryByText } = renderCircleInfoHeader(
        mockCirclePreviewPropOverrides
      );
      expect(queryByText(/Weekly/i)).toBeTruthy();
    });

    describe('When CirclePreview has no description', () => {
      it('Should not contain the description from the Circle if there is no description', () => {
        const { queryByText } = renderCircleInfoHeader({
          circle: undefined,
          circlePreview: { ...mockCirclePreview, description: undefined },
        });
        expect(queryByText(/Description/i)).toBeFalsy();
      });
    });
  });

  describe('When props.isLoading is true', () => {
    it('Should render', () => {
      expect(
        renderCircleInfoHeader({ isLoading: true, circle: undefined })
      ).toMatchSnapshot();
    });

    it('Should render the Skeleton', () => {
      const { queryByTestId } = renderCircleInfoHeader({
        isLoading: true,
        circle: undefined,
      });
      expect(queryByTestId('skeleton')).toBeTruthy();
    });
  });
});
