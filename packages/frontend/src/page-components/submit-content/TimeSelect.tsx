import { Select } from 'antd';
import { LocalTime, DateTimeFormatter } from '@js-joda/core';
import { Locale } from '@js-joda/locale_en-us';

const hours = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];
const minutes = ['00', '30'];

export function generateSearchableTimeValues(
  hour: string,
  minute: string,
  dayTime: 'AM' | 'PM'
): string {
  return `${hour}:${minute} ${dayTime} | ${hour}:${minute}${dayTime} | ${hour}${minute}${dayTime} | ${hour}${minute} ${dayTime} | ${hour}${dayTime} | ${hour} ${dayTime}`;
}

export function getValuesFromSearchableTimeValues(
  timeValue: string
): LocalTime {
  const mainString = timeValue.split('|')[0].trim(); // ex 12:30 pm
  const time = LocalTime.parse(
    mainString,
    DateTimeFormatter.ofPattern('h:mm a').withLocale(Locale.US)
  );

  return time;
}

const GenerateTimeSelect = (): JSX.Element => {
  return (
    <Select
      showSearch
      style={{ width: 200 }}
      placeholder="Select a time"
      data-testid="time-select"
    >
      {hours.map((hour) => {
        return minutes.map((minute) => {
          const timeValues = generateSearchableTimeValues(hour, minute, 'AM');
          return (
            <Select.Option value={timeValues} key={timeValues}>
              {`${hour}:${minute} AM`}
            </Select.Option>
          );
        });
      })}
      <Select.Option
        value={generateSearchableTimeValues('12', '00', 'PM')}
        key={generateSearchableTimeValues('12', '00', 'PM')}
      >
        {'12:00 PM'}
      </Select.Option>
      <Select.Option
        value={generateSearchableTimeValues('12', '30', 'PM')}
        key={generateSearchableTimeValues('12', '30', 'PM')}
      >
        {'12:30 PM'}
      </Select.Option>
      {hours.map((hour) => {
        return minutes.map((minute) => {
          const timeValues = generateSearchableTimeValues(hour, minute, 'PM');
          return (
            <Select.Option value={timeValues} key={timeValues}>
              {`${hour}:${minute} PM`}
            </Select.Option>
          );
        });
      })}
      <Select.Option
        value={generateSearchableTimeValues('12', '00', 'AM')}
        key={generateSearchableTimeValues('12', '00', 'AM')}
      >
        {'12:00 AM'}
      </Select.Option>
      <Select.Option
        value={generateSearchableTimeValues('12', '30', 'AM')}
        key={generateSearchableTimeValues('12', '30', 'AM')}
      >
        {'12:30 AM'}
      </Select.Option>
    </Select>
  );
};

export default GenerateTimeSelect;
