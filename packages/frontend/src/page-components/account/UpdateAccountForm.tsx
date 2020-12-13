import { useState } from 'react';
import { Form, Input, Select, Button } from 'antd';
import { ZoneId } from '@js-joda/core';
import Axios from 'axios';
import '@js-joda/timezone';

import { UserContextType } from '../../state-management/UserContext';
import { API_ENDPOINT } from '../../util/constants';

export const AVAILABLE_TIMEZONES = ZoneId.getAvailableZoneIds().sort();
const TimezoneSelects = AVAILABLE_TIMEZONES.map((timeZone) => (
  <Select.Option value={timeZone} key={timeZone}>
    {timeZone}
  </Select.Option>
));

const UPDATE_ACCOUNT_ENDPOINT = `${API_ENDPOINT}/user/edit`;

type Props = {
  user: UserContextType['user'];
  jwtToken: string;
  refreshUser: (bypassCache: boolean) => Promise<UserContextType['user']>;
};

interface FormValues {
  firstName: string;
  lastName: string;
  timezone: string;
}

const UpdateAccountForm = ({
  user,
  jwtToken,
  refreshUser,
}: Props): JSX.Element => {
  const { firstName, lastName, timezone } = user;
  const [form] = Form.useForm();
  const [isUpdateAccountInFlight, setIsUpdateAccountInFlight] = useState(false);

  const onFormFinish = async (values: FormValues) => {
    const userValues = {
      firstName: values.firstName,
      lastName: values.lastName,
      timezone: values.timezone,
    };
    setIsUpdateAccountInFlight(true);
    await Axios.patch(
      UPDATE_ACCOUNT_ENDPOINT,
      { ...userValues },
      {
        headers: { Authorization: jwtToken },
      }
    );

    await refreshUser(true);
    setIsUpdateAccountInFlight(false);

    return values;
  };

  return (
    <div>
      <Form
        className={''}
        form={form}
        name="horizontal_login"
        size="large"
        layout="vertical"
        onFinish={onFormFinish}
        initialValues={
          {
            firstName,
            lastName,
            timezone,
          } as FormValues
        }
      >
        <Form.Item
          name="firstName"
          rules={[
            { required: true, message: 'Sorry, you must have your first name' },
          ]}
          label="First Name"
        >
          <Input placeholder="First name" type="text" />
        </Form.Item>
        <Form.Item
          name="lastName"
          rules={[
            { required: true, message: 'Sorry, you must have your last name' },
          ]}
          label="Last Name"
        >
          <Input placeholder="Last name" type="text" />
        </Form.Item>
        <Form.Item name="timezone" label="Timezone">
          <Select showSearch style={{ width: 200 }} placeholder="Timezone">
            {TimezoneSelects}
          </Select>
        </Form.Item>
        <Form.Item shouldUpdate={true}>
          {(): JSX.Element => (
            <Button
              data-testid="submitButton"
              loading={isUpdateAccountInFlight}
              type="primary"
              htmlType="submit"
              size="large"
              block
              disabled={Boolean(
                form.getFieldsError().filter(({ errors }) => errors.length)
                  .length
              )}
            >
              Update
            </Button>
          )}
        </Form.Item>
      </Form>
    </div>
  );
};

export default UpdateAccountForm;
