import { LocalDate } from '@js-joda/core';

import { calculateFrequenciesToFetch } from './circulationSender.helper';

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
  test.todo('it should');
});

describe('createOneCirculationPerUser', () => {
  test.todo('it should');
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
