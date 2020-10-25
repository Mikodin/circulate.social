import { render, RenderResult, fireEvent } from '@testing-library/react';
import { LocalTime, DateTimeFormatter } from '@js-joda/core';
import { Locale } from '@js-joda/locale_en-us';

import TimeSelect, {
  generateSearchableTimeValues,
  getValuesFromSearchableTimeValues,
} from './TimeSelect';

function renderContainer(): RenderResult {
  return render(<TimeSelect />);
}

describe('TimeSelect', () => {
  it('Should render', () => {
    expect(renderContainer()).toMatchSnapshot();
  });

  it('Should contain multiple times when expanded', async () => {
    const container = renderContainer();
    const { queryByTestId, queryByText } = container;

    fireEvent.mouseDown(queryByTestId('time-select').querySelector('input'));

    expect(queryByText('2:30 AM')).toBeTruthy();
    expect(queryByText('6:00 AM')).toBeTruthy();
  });
});

describe('generateSearchableTimeValues', () => {
  it('should return a string of varying permutations of what a user would type', () => {
    const expectedVal = '12:30 PM | 12:30PM | 1230PM | 1230 PM | 12PM | 12 PM';
    expect(generateSearchableTimeValues('12', '30', 'PM')).toEqual(expectedVal);
  });
});

describe('getValuesFromTimeValues', () => {
  describe('When given a string from generateSearchableTimeValues', () => {
    it('Should return a joda value with that time', () => {
      const searchableTimeValue = generateSearchableTimeValues('3', '30', 'PM');
      const expectedJodaTime = LocalTime.parse(
        '3:30 PM',
        DateTimeFormatter.ofPattern('h:mm a').withLocale(Locale.US)
      );

      expect(getValuesFromSearchableTimeValues(searchableTimeValue)).toEqual(
        expectedJodaTime
      );
    });
  });
});
