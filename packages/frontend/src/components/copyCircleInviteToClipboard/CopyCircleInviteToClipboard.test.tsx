import {
  render,
  RenderResult,
  act,
  fireEvent,
  waitFor,
} from '@testing-library/react';
import * as copy from 'copy-to-clipboard';
import CopyCircleInviteToClipboard, {
  Props,
} from './CopyCircleInviteToClipboard';

const DEFAULT_PROPS = {
  circleId: 'asdf-123',
};
function renderCopyCircleInviteToClipboard(
  props?: Partial<Props>
): RenderResult {
  return render(<CopyCircleInviteToClipboard {...DEFAULT_PROPS} {...props} />);
}

describe('CopyCircleInviteToClipboard', () => {
  it('Should render', () => {
    expect(renderCopyCircleInviteToClipboard()).toMatchSnapshot();
  });

  describe('Modal open', () => {
    const renderWithModalOpen = () => {
      const container = renderCopyCircleInviteToClipboard();
      const { queryByText } = container;
      act(() => {
        fireEvent.click(queryByText('Invite'));
      });

      return container;
    };
    it('Should open a Modal on button click', async () => {
      const { queryByText } = renderWithModalOpen();

      waitFor(() => {
        expect(queryByText('Invite Someone')).toBeTruthy();
      });
    });

    describe('When Copy to Clipboard is clicked', () => {
      const copySpy = jest.spyOn(copy, 'default');
      beforeEach(() => {
        copySpy.mockClear();
      });
      it('Should call copy from copy-to-clipboard library on button click', () => {
        const { queryByText } = renderWithModalOpen();

        const copyButton = queryByText(/Copy To Clipboard/i);
        act(() => {
          fireEvent.click(copyButton);
        });

        expect(copySpy).toHaveBeenCalled();
      });

      it('Should call copy from copy-to-clipboard with text in the TextArea', () => {
        const { queryByText } = renderWithModalOpen();

        const copyButton = queryByText(/Copy To Clipboard/i);
        const textArea = queryByText(/Hey, you should come join our Circle!/i);
        const mockTextToInput = 'Come join the greatest circle ever';
        act(() => {
          fireEvent.input(textArea, {
            target: { value: mockTextToInput },
          });
        });

        act(() => {
          fireEvent.click(copyButton);
        });

        expect(copySpy).toHaveBeenCalledWith(mockTextToInput);
      });

      it('Should render "Copied!" on button click', () => {
        const { queryByText } = renderWithModalOpen();

        const copyButton = queryByText(/Copy To Clipboard/i);
        act(() => {
          fireEvent.click(copyButton);
        });

        waitFor(() => {
          expect(queryByText(/Copied!/i)).toBeTruthy();
        });
      });
      it('Should disappear', () => {
        const { queryByText } = renderWithModalOpen();

        const copyButton = queryByText(/Copy To Clipboard/i);
        act(() => {
          fireEvent.click(copyButton);
        });

        waitFor(() => {
          expect(queryByText('Invite someone')).toBeFalsy();
        });
      });
    });
  });
});
