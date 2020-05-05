import { useState, Fragment, useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Form, Input, Button, Alert } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';

import { AUTH_FORMS } from '../authContainer/AuthContainer';
import UserContext from '../../state-management/UserContext';
import css from './login.module.scss';

interface Props {
  seedEmailAddress?: string;
  redirectTo?: string;
  onSuccess?: (result?: any) => any;
  showForm?: (form: AUTH_FORMS) => any;
}
const Login = (props: Props) => {
  const router = useRouter();
  const { signIn } = useContext(UserContext);
  const [form] = Form.useForm();

  const { redirectTo, onSuccess, seedEmailAddress, showForm } = props;
  const [isInvalidCredentials, setIsInvalidCredentials] = useState(false);
  const [isLoginInFlight, setIsLoginInFlight] = useState(false);

  const onFinish = async (values) => {
    const { email, password } = values;
    try {
      setIsLoginInFlight(true);
      const result = await signIn(email, password);

      if (onSuccess) {
        onSuccess(result);
      }
      if (redirectTo) {
        router.push(redirectTo);
        return;
      }
      setIsLoginInFlight(false);
    } catch (error) {
      setIsLoginInFlight(false);
      if (error && error.code === 'NotAuthorizedException') {
        setIsInvalidCredentials(true);
      }

      if (error && error.code === 'UserNotConfirmedException' && showForm) {
        showForm(AUTH_FORMS.confirmEmail);
      }
      throw error;
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
          email: seedEmailAddress || undefined,
          password: undefined,
        }}
      >
        <Form.Item
          name="email"
          rules={[{ required: true, message: 'Please input your email' }]}
          label="Email Address"
        >
          <Input
            prefix={<MailOutlined className="site-form-item-icon" />}
            placeholder="joedoe@gmail.com"
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
          {() => {
            const isEmailTouched =
              form.isFieldTouched('email') ||
              Boolean(form.getFieldValue('email'));
            const isPasswordTouched = form.isFieldTouched('password');
            return (
              <Button
                loading={isLoginInFlight}
                type="primary"
                htmlType="submit"
                size="large"
                block
                disabled={Boolean(
                  !(isEmailTouched && isPasswordTouched) ||
                    form.getFieldsError().filter(({ errors }) => errors.length)
                      .length
                )}
              >
                {isLoginInFlight ? 'Logging in' : 'Log in'}
              </Button>
            );
          }}
        </Form.Item>
      </Form>
    </Fragment>
  );
};

export default Login;
