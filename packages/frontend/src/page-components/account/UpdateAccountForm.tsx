import { Form, Input, Select } from 'antd';
import { ZoneId } from '@js-joda/core';
import '@js-joda/timezone';

import { UserContextType } from '../../state-management/UserContext';

export const AVAILABLE_TIMEZONES = ZoneId.getAvailableZoneIds().sort();
const TimezoneSelects = AVAILABLE_TIMEZONES.map((timeZone) => (
  <Select.Option value={timeZone} key={timeZone}>
    {timeZone}
  </Select.Option>
));

type Props = {
  user: UserContextType['user'];
};

interface FormValues {
  firstName: string;
  lastName: string;
  timezone: string;
}

const UpdateAccountForm = ({ user }: Props): JSX.Element => {
  const { firstName, lastName, timezone } = user;
  const [form] = Form.useForm();

  const onFormFinish = (values: FormValues) => {
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
      </Form>
    </div>
  );
};

export default UpdateAccountForm;
