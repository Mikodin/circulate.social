import { Fragment, useState, useEffect } from 'react';
import axios from 'axios';

import { ZoneId, ZonedDateTime, LocalDateTime } from '@js-joda/core';
import '@js-joda/timezone';

import { AntdMoment, Circle } from '@circulate/types';

import {
  Form,
  Input,
  Button,
  Alert,
  DatePicker,
  TimePicker,
  Select,
} from 'antd';

import { API_ENDPOINT } from '../../util/constants';
import styles from './SubmitContentForm.module.scss';

export const SUBMIT_CONTENT_ENDPOINT = `${API_ENDPOINT}/content`;

export interface Props {
  jwtToken: string;
  seedCircleId?: string;
  onFormCompletion: (title: string) => void;
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

export const AVAILABLE_TIMEZONES = ZoneId.getAvailableZoneIds();
const TimezoneSelects = AVAILABLE_TIMEZONES.map((timeZone) => (
  <Select.Option value={timeZone} key={timeZone}>
    {timeZone}
  </Select.Option>
));

function createJodaDateTime(
  date: FormValues['date'],
  time: FormValues['time'],
  timezone: FormValues['timezone']
): ZonedDateTime {
  const dateObject = date.toObject();
  const timeObject = time.toObject();

  const { years, months, date: dateStr } = dateObject;
  const { hours, minutes } = timeObject;
  const ldt = LocalDateTime.of(years, months + 1, dateStr, hours, minutes);
  return ZonedDateTime.of(ldt, ZoneId.of(timezone));
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
      dateTimeStr = createJodaDateTime(date, time, timezone);
    }
    try {
      setIsFetchCreateContentInFlight(true);

      await axios.post(
        SUBMIT_CONTENT_ENDPOINT,
        {
          link,
          title,
          description: whyShare,
          circleIds,
          dateTime: dateTimeStr && dateTimeStr.toString(),
        },
        { headers: { Authorization: props.jwtToken } }
      );

      setIsFetchCreateContentInFlight(false);
      setIsFetchCreateContentError(false);
      props.onFormCompletion(title);
      form.resetFields();
    } catch (e) {
      console.error(e);
      setIsFetchCreateContentInFlight(false);
      setIsFetchCreateContentError(true);
    }
  }

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
        onValuesChange={(formValues: FormValues): void => {
          setIsFetchCreateContentError(false);
          if (formValues.date) {
            setIsEventForm(true);
          }
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

        <Form.Item
          name="date"
          label="Event date"
          className={styles.eventDateLabel}
        >
          <DatePicker
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

        {isEventForm && (
          <>
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
              <TimePicker showSecond={false} use12Hours={true} />
            </Form.Item>

            <Form.Item name="timezone" label="Timezone">
              <Select
                showSearch
                style={{ width: 200 }}
                placeholder="Timezone"
                optionFilterProp="children"
                filterOption={(input, option) =>
                  option &&
                  option.children &&
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >=
                    0
                }
              >
                <Select.OptGroup>Americas</Select.OptGroup>
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
