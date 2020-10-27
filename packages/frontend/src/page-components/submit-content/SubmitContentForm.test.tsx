import {
  render,
  RenderResult,
  act,
  fireEvent,
  waitFor,
} from '@testing-library/react';
import axios from 'axios';
import { LocalDate, ZonedDateTime } from '@js-joda/core';

import { mockCircle } from '../../util/testUtils/mockModels';
import SubmitContentForm, {
  SUBMIT_CONTENT_ENDPOINT,
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

const mockOnFormCompletion = jest.fn();

const userTimezone = ZonedDateTime.now().zone().toString();

const defaultProps = {
  jwtToken: '123-asd',
  seedCircleId: mockCircle.id,
  onFormCompletion: mockOnFormCompletion,
  isFetchingMyCircles: false,
  myCircles: [mockCircle],
};

function renderContainer(props?: Props): RenderResult {
  return render(<SubmitContentForm {...defaultProps} {...props} />);
}

// eslint-disable-next-line
function getAllFields(container: RenderResult) {
  const { queryByPlaceholderText, queryByText, queryByTestId } = container;

  const inputTitle = queryByPlaceholderText(/Title/i);
  const inputLink = queryByPlaceholderText(/Link/i);
  const buttonCreatingAnEvent = queryByText(/Creating an event?/i);
  const buttonNotCreatingAnEvent = queryByText(/Not creating an event?/i);
  const selectDate = queryByPlaceholderText(/Select date/i);
  const selectTime = queryByTestId('time-select');
  const selectTimezone = queryByText(userTimezone);
  const inputWhyShare = queryByPlaceholderText(/Why are you sharing this?/i);

  const buttonSubmit = queryByPlaceholderText(/Submit/i);

  return {
    inputTitle,
    inputLink,
    buttonCreatingAnEvent,
    buttonNotCreatingAnEvent,
    selectDate,
    selectTime,
    selectTimezone,
    inputWhyShare,
    buttonSubmit,
  };
}

async function enableEventForm(container: RenderResult): Promise<RenderResult> {
  const { buttonCreatingAnEvent } = getAllFields(container);
  await act(async () => {
    await fireEvent.click(buttonCreatingAnEvent);
  });

  return container;
}

async function selectADateFromDatePicker(
  container: RenderResult
): Promise<RenderResult> {
  const { queryAllByText } = container;
  const { selectDate } = getAllFields(container);

  const todayDayOfMonth = LocalDate.now().dayOfMonth();
  await act(async () => {
    await fireEvent.mouseDown(selectDate);
    await fireEvent.click(queryAllByText(`${todayDayOfMonth}`)[1]);
  });

  return container;
}

async function selectATimeFromTimePicker(
  container: RenderResult
): Promise<RenderResult> {
  const { queryAllByText } = container;
  const { selectTime } = getAllFields(container);

  await act(async () => {
    await fireEvent.click(selectTime);
    await fireEvent.change(selectTime.querySelector('input'), {
      target: { value: '5:00 PM' },
    });
    await fireEvent.click(queryAllByText('5:00 PM')[0]);
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

  await act(async () => {
    await fireEvent.click(queryAllByText(userTimezone)[0]);
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

describe('SubmitContentForm', () => {
  it('Should render', () => {
    const container = renderContainer();
    expect(container).toMatchSnapshot();
  });

  describe('When there is no value in the date input', () => {
    it('Should not render selectTimezone,or selectTime', () => {
      const container = renderContainer();
      const { selectTimezone, selectTime, selectDate } = getAllFields(
        container
      );
      expect(selectDate).not.toBeTruthy();
      expect(selectTimezone).not.toBeTruthy();
      expect(selectTime).not.toBeTruthy();
    });
  });

  describe('When a user inputs a date', () => {
    it('should render the "event" flow. selectTimezone,and selectTime should all be visible', async () => {
      const container = renderContainer();

      const eventContainer = await enableEventForm(container);
      await selectADateFromDatePicker(eventContainer);

      const { selectTimezone, selectTime } = getAllFields(container);
      expect(selectTime).toBeTruthy();
      expect(selectTimezone).toBeTruthy();
    });

    it('should set the timezone by default to the users timezone returned by Joda', async () => {
      const baseContainer = renderContainer();
      const eventContainer = await enableEventForm(baseContainer);

      const { queryByText } = eventContainer;

      await selectADateFromDatePicker(eventContainer);

      expect(queryByText(userTimezone)).toBeTruthy();
    });
  });

  describe('On submit of a complete ContentForm', () => {
    beforeEach(() => {
      mockedAxios.post.mockClear();
      mockOnFormCompletion.mockClear();
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
          element: fields.inputWhyShare,
          value: inputtedWhyShareValue,
        },
      ];

      const populatedContentContainer = await populateForm(
        container,
        fieldsToPopulate
      );

      if (isEventForm) {
        const eventContainer = await enableEventForm(populatedContentContainer);
        const populatedEventContainer = await selectADateFromDatePicker(
          eventContainer
        );
        return populatedEventContainer;
      }

      return populatedContentContainer;
    }

    it('Should render a "Submitting..." loading component', async () => {
      const { queryByText } = await renderCompleteForm(false);
      const submitButton = queryByText(/Submit/i);
      act(() => {
        fireEvent.submit(submitButton);
      });
      await waitFor(() => expect(queryByText(/Submitting.../i)).toBeTruthy());
    });

    describe('on submit of an Event form', () => {
      it('Should call Axios.post on Submit and props.onFormCompletion', async () => {
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

        const today = LocalDate.now();
        const thisMonth = today.monthValue();
        const thisDay = today.dayOfMonth();
        // const today = LocalDate.now().dayOfMonth();

        const expectedDateTime =
          userTimezone === 'America/Los_Angeles'
            ? `2020-${thisMonth}-${thisDay}T17:00-07:00[America/Los_Angeles]`
            : `2020-${thisMonth}-${thisDay}T17:00Z[UTC]`;
        const expectedSubmittedContent = {
          circleIds: [defaultProps.seedCircleId],
          title: inputtedTitleValue,
          description: inputtedWhyShareValue,
          dateTime: expectedDateTime,
          link: inputtedLinkValue,
        };
        expect(mockedAxios.post).toHaveBeenCalledWith(
          SUBMIT_CONTENT_ENDPOINT,
          expectedSubmittedContent,
          { headers: { Authorization: defaultProps.jwtToken } }
        );

        expect(mockOnFormCompletion).toHaveBeenCalledWith(
          expectedSubmittedContent
        );
      });

      describe('When time is not inputted', () => {
        it('Should not fire off Axios.post on Submit', async () => {
          const container = await renderCompleteForm(true);
          // const eventContainer = await enableEventForm(basicContainer);
          const dateChosenContainer = await selectADateFromDatePicker(
            container
          );
          const { queryByText } = dateChosenContainer;

          const submitButton = queryByText(/Submit/i);
          mockedAxios.post.mockImplementationOnce(() => Promise.resolve(true));

          await act(async () => {
            fireEvent.submit(submitButton);
          });

          expect(mockedAxios.post).not.toHaveBeenCalled();
          await waitFor(() =>
            expect(
              queryByText(/Since you have a date - there must be a time./i)
            ).toBeTruthy()
          );
        });
      });
    });
  });
});
