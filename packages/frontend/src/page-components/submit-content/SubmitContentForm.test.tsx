import {
  render,
  RenderResult,
  act,
  fireEvent,
  waitFor,
} from '@testing-library/react';
import axios from 'axios';
import { ZonedDateTime } from '@js-joda/core';

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

const userTimeZone = ZonedDateTime.now().zone().toString();

const defaultProps = {
  jwtToken: '123-asd',
  seedCircleId: 'asdf-fdsa',
};

function renderContainer(props?: Props): RenderResult {
  return render(<SubmitContentForm {...defaultProps} {...props} />);
}

// eslint-disable-next-line
function getAllFields(container: RenderResult) {
  const { queryByPlaceholderText, queryByText } = container;

  const inputTitle = queryByPlaceholderText(/Title/i);
  const inputLink = queryByPlaceholderText(/Link/i);
  const selectDate = queryByPlaceholderText(/Select date/i);
  const selectTime = queryByPlaceholderText(/Select time/i);
  const selectTimezone = queryByText(userTimeZone);
  const inputWhyShare = queryByPlaceholderText(/Why are you sharing this?/i);

  const inputCost = queryByPlaceholderText(/Cost/i);
  const buttonSubmit = queryByPlaceholderText(/Submit/i);

  return {
    inputTitle,
    inputLink,
    selectDate,
    selectTime,
    selectTimezone,
    inputWhyShare,
    inputCost,
    buttonSubmit,
  };
}

async function selectADateFromDatePicker(
  container: RenderResult
): Promise<RenderResult> {
  const { queryByText } = container;
  const { selectDate } = getAllFields(container);
  await act(async () => {
    await fireEvent.mouseDown(selectDate);
    await fireEvent.click(queryByText(/15/i));
  });

  return container;
}

async function selectATimeFromTimePicker(
  container: RenderResult
): Promise<RenderResult> {
  const { queryAllByText, queryByText } = container;
  const { selectTime } = getAllFields(container);
  await act(async () => {
    await fireEvent.mouseDown(selectTime);
    await fireEvent.click(queryAllByText(/07/i)[0]);
    await fireEvent.click(queryByText(/Ok/i));
  });

  return container;
}

async function selectTimezoneFromTimezonePicker(
  container: RenderResult
): Promise<RenderResult> {
  const { queryAllByText } = container;
  const { selectTimezone } = getAllFields(container);
  await act(async () => {
    await fireEvent.mouseDown(selectTimezone);
  });

  // await act(async () => {
  //   await fireEvent.change(selectTimezone);
  // });

  await act(async () => {
    // console.log(container.debug(selectTimezone));
    await fireEvent.click(queryAllByText(userTimeZone)[0]);
  });

  return container;
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
    it('Should not render selectTimezone,selectTime or inputCost', () => {
      const container = renderContainer();
      const { inputCost, selectTimezone, selectTime } = getAllFields(container);
      expect(inputCost).not.toBeTruthy();
      expect(selectTimezone).not.toBeTruthy();
      expect(selectTime).not.toBeTruthy();
    });
  });

  describe('When a user inputs a date', () => {
    it('should render the "event" flow. selectTimezone,selectTime and inputCost should all be visible', async () => {
      const container = renderContainer();

      await selectADateFromDatePicker(container);

      const { inputCost, selectTimezone, selectTime } = getAllFields(container);
      expect(selectTime).toBeTruthy();
      expect(selectTimezone).toBeTruthy();
      expect(inputCost).toBeTruthy();
    });

    it('should set the timezone by default to the users timezone returned by Joda', async () => {
      const container = renderContainer();
      const { queryByText } = container;

      await selectADateFromDatePicker(container);

      expect(queryByText(userTimeZone)).toBeTruthy();
    });
  });

  describe('On submit of a complete ContentForm', () => {
    beforeEach(() => {
      mockedAxios.post.mockClear();
    });
    const inputtedTitleValue = 'The greatest Circle ever';
    const inputtedLinkValue = 'https://circulate.social';
    // const inputtedDateValue = '2020-05-20';
    const inputtedWhyShareValue =
      "Because it's a great way to share and receive content that I care about";

    async function renderCompleteForm(
      isEventForm: boolean
    ): Promise<RenderResult> {
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
          element: fields.selectDate,
          value: '15',
        },
        {
          element: fields.inputWhyShare,
          value: inputtedWhyShareValue,
        },
      ];

      const populatedContentContainer = await populateForm(
        container,
        fieldsToPopulate
      );

      if (isEventForm) {
        const populatedEventContainer = await selectADateFromDatePicker(
          populatedContentContainer
        );
        return populatedEventContainer;
      }

      return populatedContentContainer;
    }

    it('Should fire off Axios.post on Submit', async () => {
      const { queryByText } = await renderCompleteForm(false);
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
      const { queryByText } = await renderCompleteForm(false);
      const submitButton = queryByText(/Submit/i);
      act(() => {
        fireEvent.submit(submitButton);
      });
      await waitFor(() => expect(queryByText(/Submitting.../i)).toBeTruthy());
    });

    describe('on submit of an Event form', () => {
      it('Should fire off Axios.post on Submit', async () => {
        const basicContainer = await renderCompleteForm(true);
        const containerToShowTimeSelect = await selectADateFromDatePicker(
          basicContainer
        );
        const containerWithSelectedTime = await selectATimeFromTimePicker(
          containerToShowTimeSelect
        );

        const container = await selectTimezoneFromTimezonePicker(
          containerWithSelectedTime
        );
        const { queryByText } = container;

        const submitButton = queryByText(/Submit/i);
        mockedAxios.post.mockImplementationOnce(() => Promise.resolve(true));

        await act(async () => {
          fireEvent.submit(submitButton);
        });

        const expectedDateTime =
          userTimeZone === 'America/Los_Angeles'
            ? '2020-05-15T07:00-07:00[America/Los_Angeles]'
            : '2020-05-15T07:00Z[UTC]';
        expect(mockedAxios.post).toHaveBeenCalledWith(
          SUBMIT_EVENT_ENDPOINT,
          {
            circleId: defaultProps.seedCircleId,
            name: inputtedTitleValue,
            description: inputtedWhyShareValue,
            dateTime: expectedDateTime,
          },
          { headers: { Authorization: defaultProps.jwtToken } }
        );
      });
    });
  });
});