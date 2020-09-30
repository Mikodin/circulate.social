import { handler } from './circulationSender';
import { generateUpcomingCirculation } from './__mocks__/generateModels';
import * as circulationDataConstructorsHelper from './circulationSender.helper';
import * as circulationHtmlConstructor from './circulationHtmlConstructor.helper';

const mockCirculation = generateUpcomingCirculation();
const mockContentId = 'zzz-123';
jest.mock('./circulationSender.helper', () => ({
  calculateFrequenciesToFetch: jest.fn(() => ({
    isWeeklyTimeToSend: false,
    isBiWeeklyTimeToSend: false,
    isMonthlyTimeToSend: false,
  })),
  fetchUpcomingCirculations: jest.fn(async () => [mockCirculation]),
  createOneCirculationPerUser: jest.fn((circulations) => circulations),
  constructCirculationComponentMaps: jest.fn(async () => ({
    circlesMap: new Map([[mockCirculation.circles, {}]]),
    usersMap: new Map([[mockCirculation.userId, {}]]),
    contentMap: new Map([[mockContentId, {}]]),
  })),
  constructFilledOutCirculations: jest.fn(
    () => new Map([[mockCirculation.urn, mockCirculation]])
  ),
  clearUpcomingContentFromCircles: jest.fn(),
  cleanup: jest.fn(async () => true),
}));

jest.mock('./circulationHtmlConstructor.helper', () => ({
  createCirculationHtmlForUser: jest.fn(),
}));

const mockMailgunSend = jest.fn();
jest.mock('mailgun-js', () =>
  jest.fn(() => ({
    messages: jest.fn(() => ({
      send: mockMailgunSend,
    })),
  }))
);

describe('circulationSender', () => {
  describe('Direct path', () => {
    describe('Fetch upcoming Circulations', () => {
      const calculateFrequenciesToFetchSpy = jest.spyOn(
        circulationDataConstructorsHelper,
        'calculateFrequenciesToFetch'
      );
      const fetchUpcomingCirculationsSpy = jest.spyOn(
        circulationDataConstructorsHelper,
        'fetchUpcomingCirculations'
      );

      beforeEach(() => {
        calculateFrequenciesToFetchSpy.mockClear();
        fetchUpcomingCirculationsSpy.mockClear().mockResolvedValueOnce([]);
      });

      it('Should call calculateFrequenciesToFetch(', async () => {
        await handler(undefined, undefined, undefined);
        expect(calculateFrequenciesToFetchSpy).toHaveBeenCalled();
      });
      it('Should call fetchUpcomingCirculations(', async () => {
        await handler(undefined, undefined, undefined);
        expect(fetchUpcomingCirculationsSpy).toHaveBeenCalled();
      });
      it('Should return early when there are no upcoming circulations', async () => {
        const createOneCirculationPerUserSpy = jest.spyOn(
          circulationDataConstructorsHelper,
          'createOneCirculationPerUser'
        );

        const res = await handler(undefined, undefined, undefined);
        expect(res).toEqual(undefined);
        expect(createOneCirculationPerUserSpy).not.toHaveBeenCalled();
      });
    });

    describe('Structuring the data', () => {
      describe('Handling multiple frequencies for a single user', () => {
        describe('One Circulation should be created for a single user', () => {
          const createOneCirculationPerUserSpy = jest.spyOn(
            circulationDataConstructorsHelper,
            'createOneCirculationPerUser'
          );
          it('Should call createOneCirculationPerUser', async () => {
            await handler(undefined, undefined, undefined);
            expect(createOneCirculationPerUserSpy).toHaveBeenCalled();
          });
        });
      });

      describe('Fetching the individual components of a circulation', () => {
        const constructCirculationComponentMapsSpy = jest.spyOn(
          circulationDataConstructorsHelper,
          'constructCirculationComponentMaps'
        );
        it('Should call constructCirculationComponentMaps', async () => {
          await handler(undefined, undefined, undefined);
          expect(constructCirculationComponentMapsSpy).toHaveBeenCalled();
        });
        describe('If there is ANY missing data, it should return', () => {
          const constructFilledOutCirculationsSpy = jest.spyOn(
            circulationDataConstructorsHelper,
            'constructFilledOutCirculations'
          );
          beforeEach(() => {
            constructCirculationComponentMapsSpy.mockClear();
            constructFilledOutCirculationsSpy.mockClear();
          });

          it('Should return if circlesMap size is 0', async () => {
            const mapWithData = new Map();
            mapWithData.set('some-key', 'foobar');
            constructCirculationComponentMapsSpy.mockResolvedValueOnce({
              circlesMap: new Map(),
              usersMap: mapWithData,
              contentMap: mapWithData,
            });

            const val = await handler(undefined, undefined, undefined);
            expect(val).toBe(undefined);
            expect(constructFilledOutCirculationsSpy).not.toHaveBeenCalled();
          });
          it('Should return if usersMap size is 0', async () => {
            const mapWithData = new Map();
            mapWithData.set('some-key', 'foobar');
            constructCirculationComponentMapsSpy.mockResolvedValueOnce({
              usersMap: new Map(),
              circlesMap: mapWithData,
              contentMap: mapWithData,
            });

            const val = await handler(undefined, undefined, undefined);
            expect(val).toBe(undefined);
            expect(constructFilledOutCirculationsSpy).not.toHaveBeenCalled();
          });
          it('Should return if contentMap size is 0', async () => {
            const mapWithData = new Map();
            mapWithData.set('some-key', 'foobar');
            constructCirculationComponentMapsSpy.mockResolvedValueOnce({
              contentMap: new Map(),
              usersMap: mapWithData,
              circlesMap: mapWithData,
            });

            const val = await handler(undefined, undefined, undefined);
            expect(val).toBe(undefined);
            expect(constructFilledOutCirculationsSpy).not.toHaveBeenCalled();
          });
        });
      });

      describe('Matching individual components with a single Circulation', () => {
        const constructFilledOutCirculationsSpy = jest.spyOn(
          circulationDataConstructorsHelper,
          'constructFilledOutCirculations'
        );

        beforeEach(() => {
          constructFilledOutCirculationsSpy.mockClear();
        });
        it('Should call constructFilledOutCirculations', async () => {
          await handler(undefined, undefined, undefined);
          expect(constructFilledOutCirculationsSpy).toHaveBeenCalled();
        });
      });
    });

    describe('Sending the Circulation email', () => {
      describe('Creating the HTML for the email', () => {
        const createCirculationHtmlForUserSpy = jest.spyOn(
          circulationHtmlConstructor,
          'createCirculationHtmlForUser'
        );

        it('Should call createCirculationHtmlForUser', async () => {
          await handler(undefined, undefined, undefined);
          expect(createCirculationHtmlForUserSpy).toHaveBeenCalled();
        });
      });

      describe('It should send a Circulation email for each user', () => {
        beforeEach(() => {
          mockMailgunSend.mockClear();
        });
        it('Should call mailgun.messages().send(emailParams) X times', async () => {
          await handler(undefined, undefined, undefined);
          expect(mockMailgunSend).toHaveBeenCalled();
        });
      });
    });

    describe('Cleanup', () => {
      it('should call cleanup', async () => {
        const cleanupSpy = jest.spyOn(
          circulationDataConstructorsHelper,
          'cleanup'
        );

        await handler(undefined, undefined, undefined);
        expect(cleanupSpy).toHaveBeenCalled();
      });
    });
  });
  describe('Path of recovery', () => {
    test.todo('should call log.error');
  });
});
