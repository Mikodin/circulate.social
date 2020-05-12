import { useState, Fragment } from 'react';
import { useRouter } from 'next/router';
import { Form, Input, Button, Alert } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';

import { AUTH_FORMS } from '../AuthContainer';
import { UserContextType } from '../../../state-management/UserContext';
import css from './Login.module.scss';

interface Props {
  seedEmail?: string;
  seedPassword?: string;
  redirectTo?: string;
  // eslint-disable-next-line
  onSuccess?: (result?: any) => void;
  showForm?: (form: AUTH_FORMS) => void;
  fetchSignIn?: UserContextType['signIn'];
  updateSeedValues?: (userValues: {
    email?: string;
    password?: string;
  }) => void;
}
const Login = (props: Props): JSX.Element => {
  const router = useRouter();
  const [form] = Form.useForm();

  const { redirectTo, onSuccess, seedEmail, showForm } = props;
  const [isInvalidCredentials, setIsInvalidCredentials] = useState(false);
  const [isLoginInFlight, setIsLoginInFlight] = useState(false);

  interface FormValues {
    email: string;
    password: string;
  }
  const onFinish = async (values: FormValues): Promise<void> => {
    const { fetchSignIn } = props;
    const { email, password } = values;
    try {
      setIsLoginInFlight(true);
      const result = await fetchSignIn(email, password);

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

  const updateValues = (changedValues: { email: string; password: string }) => {
    const { email, password } = changedValues;
    props.updateSeedValues({ email, password });
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
          email: seedEmail || undefined,
          password: undefined,
        }}
        onValuesChange={updateValues}
      >
        <Form.Item
          name="email"
          rules={[{ required: true, message: 'Please input your email' }]}
          label="Email Address"
        >
          <Input
            prefix={<MailOutlined className="site-form-item-icon" />}
            placeholder="joedoe@gmail.com"
            autoComplete="email"
            type="email"
          />
        </Form.Item>
        <Form.Item
          name="password"
          rules={[{ required: true, message: 'Please input your password' }]}
          label="Password"
        >
          <Input
            autoComplete="current-password"
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
