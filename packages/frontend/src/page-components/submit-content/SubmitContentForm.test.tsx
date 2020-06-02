import {
  render,
  RenderResult,
  act,
  fireEvent,
  waitFor,
} from '@testing-library/react';
import axios from 'axios';

import SubmitContentForm, {
  SUBMIT_EVENT_ENDPOINT,
  Props,
} from './SubmitContentForm';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.post.mockImplementation(() => Promise.resolve(true));

const mockRouterPushSpy = jest.fn(() => true);
jest.mock('next/router', () => ({
  // eslint-disable-next-line
  useRouter() {
    return {
      push: mockRouterPushSpy,
      route: '/',
      pathname: '',
      query: '',
      asPath: '',
    };
  },
}));

const defaultProps = {
  jwtToken: '123-asd',
  seedCircleId: 'asdf-fdsa',
};

function renderContainer(props?: Props): RenderResult {
  return render(<SubmitContentForm {...defaultProps} {...props} />);
}

// eslint-disable-next-line
function getAllFields(container: RenderResult) {
  const { queryByPlaceholderText } = container;

  const inputTitle = queryByPlaceholderText(/Title/i);
  const inputLink = queryByPlaceholderText(/Link/i);
  const inputDate = queryByPlaceholderText(/Date/i);
  const inputWhyShare = queryByPlaceholderText(/Why are you sharing this?/i);

  const inputCost = queryByPlaceholderText(/Cost/i);
  const inputTimezone = queryByPlaceholderText(/Timezone/i);
  const buttonSubmit = queryByPlaceholderText(/Submit/i);

  return {
    inputTitle,
    inputLink,
    inputDate,
    inputWhyShare,
    inputCost,
    inputTimezone,
    buttonSubmit,
  };
}

interface FieldToPopulate {
  element: HTMLElement;
  value: string | number;
}
async function populateForm(
  container: RenderResult,
  fieldsToPopulate: FieldToPopulate[]
): Promise<RenderResult> {
  fieldsToPopulate.forEach((field) => {
    const { element, value } = field;
    act(() => {
      fireEvent.change(element, {
        target: { value },
      });
    });
  });

  return container;
}

describe('StartACircle page', () => {
  it('Should render', () => {
    const container = renderContainer();
    expect(container).toMatchSnapshot();
  });

  describe('When there is no value in the date input', () => {
    it('Should not render inputCost or inputTimezone ', () => {
      const container = renderContainer();
      const { inputCost, inputTimezone } = getAllFields(container);
      expect(inputCost).not.toBeTruthy();
      expect(inputTimezone).not.toBeTruthy();
    });
  });

  describe('When a user inputs a date', () => {
    it('should render the "event" flow.  inputCost, and inputTimezone should be visible', async () => {
      const container = renderContainer();
      const { inputDate } = getAllFields(container);

      await populateForm(container, [
        { element: inputDate, value: '2020-05-30' },
      ]);

      const { inputCost, inputTimezone } = getAllFields(container);
      expect(inputCost).toBeTruthy();
      expect(inputTimezone).toBeTruthy();
    });
  });

  describe('On submit of a complete ContentForm', () => {
    beforeEach(() => {
      mockedAxios.post.mockClear();
    });
    const inputtedTitleValue = 'The greatest Circle ever';
    const inputtedLinkValue = 'https://circulate.social';
    const inputtedDateValue = '2020-05-20';
    const inputtedWhyShareValue =
      "Because it's a great way to share and receive content that I care about";
    // const inputtedCostValue = '$20';
    // const inputtedTimezoneValue = 'EST';
    // const inputtedShareToCirclesValue = ['abc-123'];

    async function renderCompleteForm(): Promise<RenderResult> {
      const container = renderContainer();
      const fields = getAllFields(container);
      const fieldsToPopulate = [
        {
          element: fields.inputTitle,
          value: inputtedTitleValue,
        },
        {
          element: fields.inputLink,
          value: inputtedLinkValue,
        },
        {
          element: fields.inputDate,
          value: inputtedDateValue,
        },
        {
          element: fields.inputWhyShare,
          value: inputtedWhyShareValue,
        },
        // {
        //   element: fields.inputCost,
        //   value: inputtedCostValue,
        // },
      ];
      const populatedContainer = await populateForm(
        container,
        fieldsToPopulate
      );
      return populatedContainer;
    }

    it('Should fire off Axios.post on Submit', async () => {
      const { queryByText } = await renderCompleteForm();
      const submitButton = queryByText(/Submit/i);
      mockedAxios.post.mockImplementationOnce(() => Promise.resolve(true));

      await act(async () => {
        fireEvent.submit(submitButton);
      });
      expect(mockedAxios.post).toHaveBeenCalledWith(
        SUBMIT_EVENT_ENDPOINT,
        {
          circleId: defaultProps.seedCircleId,
          name: inputtedTitleValue,
          description: inputtedWhyShareValue,
        },
        { headers: { Authorization: defaultProps.jwtToken } }
      );
    });

    it('Should render a "Submitting..." loading component', async () => {
      const { queryByText } = await renderCompleteForm();
      const submitButton = queryByText(/Submit/i);
      act(() => {
        fireEvent.submit(submitButton);
      });
      await waitFor(() => expect(queryByText(/Submitting.../i)).toBeTruthy());
    });
  });
});
