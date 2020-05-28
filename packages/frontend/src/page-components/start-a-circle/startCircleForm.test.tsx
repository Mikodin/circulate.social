import {
  render,
  RenderResult,
  act,
  fireEvent,
  waitFor,
} from '@testing-library/react';
import axios from 'axios';

import StartCircleForm, {
  Props,
  CREATE_CIRCLE_ENDPOINT,
} from './StartCircleForm';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

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

const MOCK_JWT_TOKEN = '123-abc';
const DEFAULT_PROPS = { jwtToken: MOCK_JWT_TOKEN };
function renderStartCircleForm(props?: Partial<Props>): RenderResult {
  return render(<StartCircleForm {...DEFAULT_PROPS} {...props} />);
}

// eslint-disable-next-line
function getAllInputs(container: RenderResult) {
  const { queryByPlaceholderText, queryByText } = container;
  const inputNameOfCircle = queryByPlaceholderText(/Circle name/i);
  const inputDescription = queryByPlaceholderText(/Circle description/i);
  const dropdownCircleFrequency = queryByPlaceholderText(
    /Please select your Circulation frequency/i
  );
  const radioCirclePrivate = queryByText(/Private/i);
  const radioCirclePublic = queryByText(/Public/i);
  const buttonSubmit = queryByText(/Create Circle/i);
  return {
    inputNameOfCircle,
    inputDescription,
    buttonSubmit,
    dropdownCircleFrequency,
    radioCirclePrivate,
    radioCirclePublic,
  };
}

const nameOfCircleValue = 'The greatest circle ever';
const descriptionValue = 'The greatest description ever';

const setupCompleteForm = async (): Promise<RenderResult> => {
  const container = renderStartCircleForm();

  const {
    inputNameOfCircle,
    inputDescription,
    // circleFrequencyDropdown,
    // circlePrivacyRadio,
  } = getAllInputs(container);

  await act(async () => {
    fireEvent.change(inputNameOfCircle, {
      target: { value: nameOfCircleValue },
    });

    fireEvent.change(inputDescription, {
      target: { value: descriptionValue },
    });
  });

  return container;
};

describe('StartCircleForm', () => {
  beforeEach(() => {
    mockedAxios.post.mockClear();
    mockRouterPushSpy.mockClear();
  });

  it('Should render', () => {
    expect(renderStartCircleForm()).toMatchSnapshot();
  });

  describe('On submission of a complete form', () => {
    it('Should call Axios.post to the API url with all the form fields and props.jwtToken in the headers', async () => {
      const container = await setupCompleteForm();
      const { buttonSubmit } = getAllInputs(container);
      const data = { data: { circle: { id: '123' } } };
      mockedAxios.post.mockImplementationOnce(() => Promise.resolve(data));
      await act(async () => {
        fireEvent.submit(buttonSubmit);
      });

      await waitFor(() => {
        expect(mockedAxios.post).toBeCalledWith(
          CREATE_CIRCLE_ENDPOINT,
          {
            name: nameOfCircleValue,
            description: descriptionValue,
            frequency: 'weekly',
            privacy: 'private',
          },
          { headers: { Authorization: MOCK_JWT_TOKEN } }
        );
      });
    });

    it('Should route the user to the newly created circles page', async () => {
      const container = await setupCompleteForm();
      const { buttonSubmit } = getAllInputs(container);
      const data = { data: { circle: { id: '123' } } };
      mockedAxios.post.mockImplementationOnce(() => Promise.resolve(data));
      await act(async () => {
        fireEvent.submit(buttonSubmit);
      });

      await waitFor(() => {
        expect(mockRouterPushSpy).toBeCalledWith(
          '/circles/[circleId]',
          `/circles/${data.data.circle.id}`
        );
      });
    });

    it('should display "Creating Circle..." while the request is in flight', async () => {
      const container = await setupCompleteForm();
      const { queryByText } = container;
      const { buttonSubmit } = getAllInputs(container);
      const data = { data: { circle: { id: '123' } } };
      mockedAxios.post.mockImplementationOnce(() => Promise.resolve(data));

      act(() => {
        fireEvent.submit(buttonSubmit);
      });

      await waitFor(() => {
        expect(queryByText(/Creating Circle.../i)).toBeTruthy();
      });
    });
  });

  describe('Unhappy path', () => {
    describe(`When the "name" field isn't filled out`, () => {
      it('should disable the submit button', async () => {
        const container = await renderStartCircleForm();
        const { buttonSubmit } = getAllInputs(container);
        act(() => {
          fireEvent.submit(buttonSubmit);
        });

        await waitFor(() => {
          expect(mockedAxios).not.toBeCalled();
        });
      });
    });
    describe(`When the POST request returns an error`, () => {
      it('should display an alert to the user telling them to try again', async () => {
        const container = await setupCompleteForm();
        const { queryByText } = container;
        const { buttonSubmit } = getAllInputs(container);

        mockedAxios.post.mockImplementationOnce(() => Promise.reject());

        await act(async () => {
          fireEvent.submit(buttonSubmit);
        });

        await waitFor(() => {
          expect(
            queryByText(/Something went wrong, please try again./i)
          ).toBeTruthy();
        });
      });
    });
  });
});
