import { Fragment, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

import { ZoneId, ZonedDateTime, LocalDateTime } from '@js-joda/core';
import '@js-joda/timezone';

import { AntdMoment } from '@circulate/types';

import {
  Form,
  Input,
  Button,
  Alert,
  DatePicker,
  TimePicker,
  Select,
} from 'antd';

import css from './SubmitContentForm.module.scss';

export const SUBMIT_EVENT_ENDPOINT =
  'https://z3edrz53yg.execute-api.us-east-1.amazonaws.com/dev/events/create';

export interface Props {
  jwtToken: string;
  seedCircleId?: string;
}

export const AVAILABLE_TIMEZONES = ZoneId.getAvailableZoneIds();
const TimezoneSelects = AVAILABLE_TIMEZONES.map((timeZone) => (
  <Select.Option value={timeZone} key={timeZone}>
    {timeZone}
  </Select.Option>
));

const SubmitContentForm = (props: Props): JSX.Element => {
  const [form] = Form.useForm();
  const router = useRouter();
  const { seedCircleId } = props;

  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isEventForm, setIsEventForm] = useState(false);
  const [
    isFetchCreateContentInFlight,
    setIsFetchCreateContentInFlight,
  ] = useState(false);

  const [isFetchCreateContentError, setIsFetchCreateContentError] = useState(
    false
  );

  const userTimeZone = ZonedDateTime.now().zone().toString();

  interface FormValues {
    title: string;
    link: string;
    date: AntdMoment & string;
    time: AntdMoment & string;
    whyShare: string;
    cost: number;
    timezone: string;
  }

  useEffect(() => {
    if (!isEventForm) {
      form.setFieldsValue({ date: '' });
      form.setFieldsValue({ time: '' });
      form.setFieldsValue({ timezone: userTimeZone });
    }
  }, [isEventForm]);

  async function onFinish(formValues: FormValues): Promise<void> {
    const { title, whyShare, date, time, timezone } = formValues;

    let dateTimeStr: undefined | ZonedDateTime;
    if (date && time) {
      const dateObject = date.toObject();
      const timeObject = time.toObject();

      const { years, months, date: dateStr } = dateObject;
      const { hours, minutes } = timeObject;
      const ldt = LocalDateTime.of(years, months, dateStr, hours, minutes);
      dateTimeStr = ZonedDateTime.of(ldt, ZoneId.of(timezone));
    }
    try {
      setIsFetchCreateContentInFlight(true);

      await axios.post(
        SUBMIT_EVENT_ENDPOINT,
        {
          name: title,
          description: whyShare,
          circleId: seedCircleId,
          dateTime: dateTimeStr && dateTimeStr.toString(),
        },
        { headers: { Authorization: props.jwtToken } }
      );

      setIsFetchCreateContentInFlight(false);
      setIsFetchCreateContentError(false);
      router.push(`/circles/${seedCircleId}`);

      return;
    } catch (e) {
      console.error(e);
      setIsFetchCreateContentInFlight(false);
      setIsFetchCreateContentError(true);
    }
  }

  return (
    <Fragment>
      <Form
        className={css.form}
        form={form}
        hideRequiredMark
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
            cost: 0,
            timezone: userTimeZone,
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

        <Form.Item name="date" label="Event date">
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
            <Form.Item name="time" label="Event time">
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

            <Form.Item name="cost" label="Event cost">
              <Input placeholder="Cost" type="text" />
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
