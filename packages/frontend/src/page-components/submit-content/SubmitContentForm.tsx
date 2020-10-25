import { Fragment, useState, useEffect } from 'react';
import axios from 'axios';

import {
  ZoneId,
  ZonedDateTime,
  LocalDateTime,
  LocalTime,
  LocalDate,
} from '@js-joda/core';
import '@js-joda/timezone';

import { AntdMoment, Circle, Content } from '@circulate/types';

import { Form, Input, Button, Alert, DatePicker, Select } from 'antd';

import { API_ENDPOINT } from '../../util/constants';
import styles from './SubmitContentForm.module.scss';

import GenerateTimeSelect, {
  getValuesFromSearchableTimeValues,
} from './TimeSelect';

export const SUBMIT_CONTENT_ENDPOINT = `${API_ENDPOINT}/content`;

export interface Props {
  jwtToken: string;
  seedCircleId?: string;
  onFormCompletion: (content: Partial<Content>) => void;
  myCircles: Circle[];
  isFetchingMyCircles: boolean;
}

interface FormValues {
  title: string;
  link: string;
  date: AntdMoment & string;
  time: AntdMoment & string;
  whyShare: string;
  timezone: string;
  circleIds: string[];
}

export const AVAILABLE_TIMEZONES = ZoneId.getAvailableZoneIds().sort();
const TimezoneSelects = AVAILABLE_TIMEZONES.map((timeZone) => (
  <Select.Option value={timeZone} key={timeZone}>
    {timeZone}
  </Select.Option>
));

function createJodaDateTime(
  date: FormValues['date'],
  time: LocalTime,
  timezone: FormValues['timezone']
): ZonedDateTime {
  const localDate = LocalDate.parse(date.format('YYYY-MM-DD'));
  const ldt = LocalDateTime.of(localDate, time);
  const zdt = ZonedDateTime.of(ldt, ZoneId.of(timezone));
  return zdt;
}

const SubmitContentForm = (props: Props): JSX.Element => {
  const [form] = Form.useForm();
  const { seedCircleId, myCircles, isFetchingMyCircles } = props;

  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isEventForm, setIsEventForm] = useState(false);
  const [
    isFetchCreateContentInFlight,
    setIsFetchCreateContentInFlight,
  ] = useState(false);

  const [isFetchCreateContentError, setIsFetchCreateContentError] = useState(
    false
  );

  const userTimezone = ZonedDateTime.now().zone().toString();

  useEffect(() => {
    if (!isEventForm) {
      form.setFieldsValue({ date: '' });
      form.setFieldsValue({ time: '' });
      form.setFieldsValue({ timezone: userTimezone });
    }
  }, [isEventForm]);

  useEffect(() => {
    const seedCircle = myCircles.find((circle) => circle.id === seedCircleId);
    if (seedCircle) {
      form.setFieldsValue({ circleIds: [seedCircle.id] });
    }
  }, [myCircles]);

  async function onFinish(formValues: FormValues): Promise<void> {
    const {
      title,
      whyShare,
      date,
      time,
      timezone,
      link,
      circleIds,
    } = formValues;

    let dateTimeStr: undefined | ZonedDateTime;
    if (date && time) {
      dateTimeStr = createJodaDateTime(
        date,
        getValuesFromSearchableTimeValues(time),
        timezone
      );
    }
    try {
      setIsFetchCreateContentInFlight(true);

      const content = {
        link,
        title,
        description: whyShare,
        circleIds,
        dateTime: dateTimeStr && dateTimeStr.toString(),
      };
      await axios.post(SUBMIT_CONTENT_ENDPOINT, content, {
        headers: { Authorization: props.jwtToken },
      });

      setIsFetchCreateContentInFlight(false);
      setIsFetchCreateContentError(false);
      setIsEventForm(false);
      props.onFormCompletion(content);
      form.resetFields();
      form.setFieldsValue({ circleIds: [seedCircleId] });
    } catch (e) {
      console.error(e);
      setIsFetchCreateContentInFlight(false);
      setIsFetchCreateContentError(true);
    }
  }

  // const nowHour = new Date().toLocaleTimeString('en-US', {
  //   hour12: true,
  //   hour: 'numeric',
  // });
  return (
    <Fragment>
      <Form
        className={styles.form}
        form={form}
        name="horizontal_login"
        size="large"
        layout="vertical"
        onFinish={onFinish}
        initialValues={
          {
            title: '',
            link: '',
            date: '',
            time: '',
            whyShare: '',
            circleIds: [],
            timezone: userTimezone,
          } as FormValues
        }
        onValuesChange={(): void => {
          setIsFetchCreateContentError(false);
        }}
      >
        <Form.Item
          name="title"
          rules={[{ required: true, message: 'Please give your post a Title' }]}
          label="Title of post"
        >
          <Input placeholder="Title" type="text" />
        </Form.Item>

        <Form.Item name="link" label="Link to content">
          <Input placeholder="Link" type="text" />
        </Form.Item>

        <Button type="link" onClick={() => setIsEventForm(!isEventForm)}>
          {isEventForm ? 'Not creating an event?' : 'Creating an event?'}
        </Button>
        {isEventForm && (
          <>
            <Form.Item
              name="date"
              label="Event date"
              className={styles.eventDateLabel}
            >
              <DatePicker
                disabledDate={(
                  dateToCheckAgainstTodayMoment: moment.Moment
                ) => {
                  const dateToCheckAgainstToday = LocalDate.parse(
                    dateToCheckAgainstTodayMoment.format('YYYY-MM-DD')
                  );
                  const today = LocalDate.now();

                  const disableDateBecauseItIsBeforeToday = dateToCheckAgainstToday.isBefore(
                    today
                  );

                  return disableDateBecauseItIsBeforeToday;
                }}
                format={'MMMM D'}
                use12Hours={true}
                open={isDatePickerOpen}
                onOpenChange={(isOpen): void => {
                  setIsDatePickerOpen(isOpen);
                  if (!isOpen && !form.getFieldValue('date')) {
                    setIsEventForm(false);
                  } else if (form.getFieldValue('date')) {
                    setIsEventForm(true);
                  }
                }}
                renderExtraFooter={(): JSX.Element => (
                  <Button
                    onClick={(): void => {
                      setIsDatePickerOpen(false);
                      setIsEventForm(false);
                    }}
                  >
                    Clear
                  </Button>
                )}
                allowClear={false}
              />
            </Form.Item>

            <Form.Item
              name="time"
              label="Event time"
              rules={[
                {
                  required: true,
                  message: 'Since you have a date - there must be a time.',
                },
              ]}
            >
              {GenerateTimeSelect()}
            </Form.Item>

            <Form.Item name="timezone" label="Timezone">
              <Select showSearch style={{ width: 200 }} placeholder="Timezone">
                {TimezoneSelects}
              </Select>
            </Form.Item>
          </>
        )}
        <Form.Item name="whyShare" label="Why are you sharing this?">
          <Input.TextArea
            rows={3}
            placeholder="Why are you sharing this?"
            // onFocus={(): void => setShowDescriptionPopover(true)}
            style={{ fontSize: '16px' }}
          />
        </Form.Item>
        <Form.Item
          name="circleIds"
          rules={[
            {
              required: true,
              message: 'Please select a Circle to share this to',
            },
          ]}
          label="Where are you sharing this to?"
        >
          <Select
            mode="multiple"
            loading={isFetchingMyCircles}
            disabled={isFetchingMyCircles}
            showArrow
            showSearch={false}
          >
            {props.myCircles.map((circle) => (
              <Select.Option key={circle.id} value={circle.id}>
                {circle.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        {isFetchCreateContentError && (
          <Alert
            message="Something went wrong, please try again."
            type="error"
            showIcon
            closable
            banner
            style={{ marginBottom: '10px' }}
          />
        )}
        <Form.Item shouldUpdate={true}>
          {(): JSX.Element => {
            const isTitleTouched = form.isFieldTouched('title');
            const isFormTouched = isTitleTouched;
            return (
              <Button
                data-testid="submitButton"
                loading={isFetchCreateContentInFlight}
                type="primary"
                htmlType="submit"
                size="large"
                block
                disabled={Boolean(
                  !isFormTouched ||
                    form.getFieldsError().filter(({ errors }) => errors.length)
                      .length
                )}
              >
                {isFetchCreateContentInFlight ? 'Submitting...' : 'Submit'}
              </Button>
            );
          }}
        </Form.Item>
      </Form>
    </Fragment>
  );
};

export default SubmitContentForm;
