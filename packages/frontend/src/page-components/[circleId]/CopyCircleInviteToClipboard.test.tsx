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

  it('Should call copy from copy-to-clipboard library on button click', () => {
    const copySpy = jest.spyOn(copy, 'default');
    const { queryByText } = renderCopyCircleInviteToClipboard();

    const copyButton = queryByText(/Invite/i);
    act(() => {
      fireEvent.click(copyButton);
    });

    expect(copySpy).toHaveBeenCalled();
  });

  it('Should render "Copied!" on button click', () => {
    const { queryByText } = renderCopyCircleInviteToClipboard();

    const copyButton = queryByText(/Invite/i);
    act(() => {
      fireEvent.click(copyButton);
    });

    waitFor(() => {
      expect(queryByText(/Copied!/i)).toBeTruthy();
    });
  });
});
