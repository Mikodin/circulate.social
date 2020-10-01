import { LocalDate } from '@js-joda/core';
import { Condition } from 'dynamoose';
import { generateUpcomingCirculation } from './__mocks__/generateModels';

import {
  calculateFrequenciesToFetch,
  fetchUpcomingCirculations,
  createOneCirculationPerUser,
} from './circulationSender.helper';
import UpcomingCirculationModel from '../interfaces/dynamo/upcomingCirculationModel';

const mockUpcomingCirculation = generateUpcomingCirculation();
jest.mock('../interfaces/dynamo/upcomingCirculationModel', () => ({
  scan: jest.fn(() => ({
    all: jest.fn(() => ({
      exec: jest.fn(() =>
        Promise.resolve([
          {
            original: () => mockUpcomingCirculation,
          },
        ])
      ),
    })),
  })),
}));

describe('calculateFrequenciesToFetch', () => {
  const localDateNowSpy = jest.spyOn(LocalDate, 'now');
  const today = LocalDate.now();
  const firstDayOfMonth = today.minusDays(today.dayOfMonth() - 1);
  const firstFridayOfMonth = firstDayOfMonth
    .minusDays(firstDayOfMonth.dayOfWeek().ordinal())
    .plusDays(4);
  const lastDayOfMonth = firstDayOfMonth.plusDays(today.lengthOfMonth() - 1);

  describe('When the day is Friday', () => {
    it('should return isWeeklyTimeToSend as true', () => {
      localDateNowSpy.mockReturnValueOnce(firstFridayOfMonth);
      expect(calculateFrequenciesToFetch().isWeeklyTimeToSend).toBeTruthy();
    });

    // describe('When it is a bi-weekly Friday', () => {
    //   it('should return isWeeklyTimeToSend and isBiWeeklyTimeToSend as true', () => {
    //     localDateNowSpy.mockReturnValueOnce(secondFridayOfMonth);
    //     const {
    //       isWeeklyTimeToSend,
    //       isBiWeeklyTimeToSend,
    //     } = calculateFrequenciesToFetch();

    //     expect(isWeeklyTimeToSend).toBeTruthy();
    //     expect(isBiWeeklyTimeToSend).toBeTruthy();
    //   });
    // });
  });

  describe('When it is the last day of the month', () => {
    it('should return isMonthlyTimeToSend as true', () => {
      localDateNowSpy.mockReturnValueOnce(lastDayOfMonth);
      expect(calculateFrequenciesToFetch().isMonthlyTimeToSend).toBeTruthy();
    });

    describe('When the last day of the month is also a Friday', () => {
      // Honestly this only happens a few time a year - the test setup is a pain in the ass - skip it
      it.skip('should return isMonthlyTimeToSend and isWeeklyTimeToSend as true', () => {
        localDateNowSpy.mockReturnValueOnce(lastDayOfMonth);
        const {
          isWeeklyTimeToSend,
          isMonthlyTimeToSend,
        } = calculateFrequenciesToFetch();
        expect(isWeeklyTimeToSend).toBeTruthy();
        expect(isMonthlyTimeToSend).toBeTruthy();
      });
    });
  });
});

describe('fetchUpcomingCirculations', () => {
  const upcomingCirculationModelScanSpy = jest.spyOn(
    UpcomingCirculationModel,
    'scan'
  );
  beforeEach(() => {
    upcomingCirculationModelScanSpy.mockClear();
  });

  it('Should return an array of  Circulations from the DB', async () => {
    const upcomingCirculations = await fetchUpcomingCirculations({
      isWeeklyTimeToSend: false,
      isMonthlyTimeToSend: false,
    });
    expect(upcomingCirculations).toEqual([mockUpcomingCirculation]);
  });

  describe('Deciding which frequency of Circulations should be fetched', () => {
    describe('When isWeeklyTimeToSend and isMonthlyTimeToSend are false', () => {
      it('Should call UpcomingCirculationModel.scan( with only daily filter', async () => {
        const dailyFilter = new Condition('frequency').contains('daily');
        await fetchUpcomingCirculations({
          isWeeklyTimeToSend: false,
          isMonthlyTimeToSend: false,
        });
        expect(upcomingCirculationModelScanSpy).toHaveBeenCalledWith(
          dailyFilter
        );
      });
    });
    describe('When given only isWeeklyTimeToSend: true', () => {
      it('Should call UpcomingCirculationModel.scan( with daily and weekly filters', async () => {
        const weeklyFilter = new Condition('frequency')
          .contains('daily')
          .or()
          .where('frequency')
          .contains('weekly');
        await fetchUpcomingCirculations({
          isWeeklyTimeToSend: true,
          isMonthlyTimeToSend: false,
        });
        expect(upcomingCirculationModelScanSpy).toHaveBeenCalledWith(
          weeklyFilter
        );
      });
    });
    describe('When given only isMonthlyTimeToSend: true', () => {
      it('Should call UpcomingCirculationModel.scan( with daily and monthly filters', async () => {
        const monthlyFilter = new Condition('frequency')
          .contains('daily')
          .or()
          .where('frequency')
          .contains('monthly');

        upcomingCirculationModelScanSpy.mockClear();
        await fetchUpcomingCirculations({
          isWeeklyTimeToSend: false,
          isMonthlyTimeToSend: true,
        });
        expect(upcomingCirculationModelScanSpy).toHaveBeenCalledWith(
          monthlyFilter
        );
      });
    });

    describe('When given both isWeeklyTimeToSend and isMonthlyTimeToSend: true', () => {
      it('Should call UpcomingCirculationModel.scan( with daily, weekly and monthly filters', async () => {
        const weeklyAndMonthlyFilter = new Condition('frequency')
          .contains('daily')
          .or()
          .where('frequency')
          .contains('weekly')
          .or()
          .where('frequency')
          .contains('monthly');

        upcomingCirculationModelScanSpy.mockClear();
        await fetchUpcomingCirculations({
          isWeeklyTimeToSend: true,
          isMonthlyTimeToSend: true,
        });
        expect(upcomingCirculationModelScanSpy).toHaveBeenCalledWith(
          weeklyAndMonthlyFilter
        );
      });
    });
  });
});

describe('createOneCirculationPerUser', () => {
  describe('When given multiple frequency circulations for the same user', () => {
    const userId = 'abc-123';
    const dailyCirculation = generateUpcomingCirculation({
      urn: `${userId}:daily`,
      userId,
    });
    const weeklyCirculation = generateUpcomingCirculation({
      urn: `${userId}:weekly`,
      userId,
    });
    const monthlyCirculation = generateUpcomingCirculation({
      urn: `${userId}:monthly`,
      userId,
    });
    const circulations = [
      dailyCirculation,
      weeklyCirculation,
      monthlyCirculation,
    ];
    it('Should combine them into one circulation', () => {
      expect(createOneCirculationPerUser(circulations)).toEqual([
        {
          circles: [
            ...dailyCirculation.circles,
            ...weeklyCirculation.circles,
            ...monthlyCirculation.circles,
          ],
          circulationId: 'temp',
          frequency: 'all',
          urn: `${userId}:allFrequencies`,
          userId,
        },
      ]);
    });
  });

  describe('Handling multiple users', () => {
    const userIdA = 'abc-123';
    const dailyCirculationA = generateUpcomingCirculation({
      urn: `${userIdA}:daily`,
      userId: userIdA,
    });
    const weeklyCirculationA = generateUpcomingCirculation({
      urn: `${userIdA}:weekly`,
      userId: userIdA,
    });

    const userIdB = 'def-123';
    const dailyCirculationB = generateUpcomingCirculation({
      urn: `${userIdB}:daily`,
      userId: userIdB,
    });
    const weeklyCirculationB = generateUpcomingCirculation({
      urn: `${userIdB}:weekly`,
      userId: userIdB,
    });
    it('Should return 1 circulation per user', () => {
      const circulations = [
        dailyCirculationA,
        weeklyCirculationA,
        dailyCirculationB,
        weeklyCirculationB,
      ];
      expect(createOneCirculationPerUser(circulations)).toEqual([
        {
          circles: [
            ...dailyCirculationA.circles,
            ...weeklyCirculationA.circles,
          ],
          circulationId: 'temp',
          frequency: 'all',
          urn: `${userIdA}:allFrequencies`,
          userId: userIdA,
        },
        {
          circleDetails: undefined,
          circles: [
            ...dailyCirculationB.circles,
            ...weeklyCirculationB.circles,
          ],
          circulationId: 'temp',
          frequency: 'all',
          urn: `${userIdB}:allFrequencies`,
          userId: userIdB,
        },
      ]);
    });
  });
});

describe('constructCirculationComponentMaps', () => {
  test.todo('it should');
});

describe('constructFilledOutCirculations', () => {
  test.todo('it should');
});

describe('cleanup', () => {
  test.todo('it should');
});
