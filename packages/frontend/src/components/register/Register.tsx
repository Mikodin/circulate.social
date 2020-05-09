import { useState, Fragment, useContext } from 'react';
import { useRouter } from 'next/router';
import { Form, Input, Button, Alert } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';

import { AUTH_FORMS } from '../authContainer/AuthContainer';
import UserContext from '../../state-management/UserContext';
import css from './Register.module.scss';

interface Props {
  seedEmailAddress?: string;
  redirectTo?: string;
  // eslint-disable-next-line
  onSuccess?: (result?: any) => void;
  showForm?: (form: AUTH_FORMS) => void;
}
const Register = (props: Props): JSX.Element => {
  const router = useRouter();
  const { register } = useContext(UserContext);
  const [form] = Form.useForm();

  const { redirectTo, onSuccess, seedEmailAddress } = props;
  const [isInvalidCredentials] = useState(false);
  const [isRegisterInFlight, setIsRegisterInFlight] = useState(false);

  interface FormValues {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }
  const onFinish = async (values: FormValues): Promise<void> => {
    const { email, password, firstName, lastName } = values;
    try {
      setIsRegisterInFlight(true);
      const result = await register(email, password, firstName, lastName);
      if (onSuccess) {
        onSuccess({ ...result, email: result.email });
      }

      if (redirectTo) {
        router.push(redirectTo);
        return;
      }

      setIsRegisterInFlight(false);
    } catch (error) {
      console.error(error);
      setIsRegisterInFlight(false);
    }
  };

  return (
    <Fragment>
      <Form
        className={css.form}
        form={form}
        name="horizontal_login"
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          firstName: undefined,
          lastName: undefined,
          email: seedEmailAddress || undefined,
          password: undefined,
        }}
      >
        <Form.Item
          name="firstName"
          rules={[{ required: true, message: 'Please input name' }]}
          label="First name"
        >
          <Input
            prefix={<UserOutlined className="site-form-item-icon" />}
            placeholder="John"
          />
        </Form.Item>
        <Form.Item
          name="lastName"
          rules={[{ required: true, message: 'Please input your last name' }]}
          label="Last name"
        >
          <Input
            prefix={<UserOutlined className="site-form-item-icon" />}
            placeholder="Doe"
          />
        </Form.Item>
        <Form.Item
          name="email"
          rules={[{ required: true, message: 'Please input your email' }]}
          label="Email Address"
        >
          <Input
            prefix={<MailOutlined className="site-form-item-icon" />}
            placeholder="johndoe@gmail.com"
            type="email"
          />
        </Form.Item>
        <Form.Item
          name="password"
          rules={[{ required: true, message: 'Please input your password' }]}
          label="Password"
        >
          <Input
            prefix={<LockOutlined className="site-form-item-icon" />}
            type="password"
            placeholder="Password"
          />
        </Form.Item>

        {isInvalidCredentials && (
          <Alert message="Invalid username or password" type="error" showIcon />
        )}
        <Form.Item shouldUpdate={true}>
          {(): JSX.Element => {
            const isEmailTouched =
              form.isFieldTouched('email') ||
              Boolean(form.getFieldValue('email'));
            const isFirstNameTouched = form.isFieldTouched('firstName');
            const isLastNameTouched = form.isFieldTouched('lastName');
            const isPasswordTouched = form.isFieldTouched('password');
            const isFormTouched =
              isFirstNameTouched &&
              isLastNameTouched &&
              isPasswordTouched &&
              isEmailTouched;
            return (
              <Button
                loading={isRegisterInFlight}
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
                {isRegisterInFlight ? 'Signing up' : 'Sign up'}
              </Button>
            );
          }}
        </Form.Item>
      </Form>
    </Fragment>
  );
};

export default Register;
