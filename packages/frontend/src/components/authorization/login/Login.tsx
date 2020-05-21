import { useState, Fragment } from 'react';
import { useRouter } from 'next/router';
import { Form, Input, Button, Alert } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';

import { AUTH_FORMS } from '../AuthContainer';
import { UserContextType } from '../../../state-management/UserContext';
import css from './Login.module.scss';

export interface Props {
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
  const { redirectTo, onSuccess, seedEmail, seedPassword, showForm } = props;

  const router = useRouter();
  const [form] = Form.useForm();

  const [isInvalidCredentials, setIsInvalidCredentials] = useState(false);
  const [isLoginInFlight, setIsLoginInFlight] = useState(false);

  interface FormValues {
    email: string;
    password: string;
  }

  const handleSignIn = async (
    email: string,
    password: string
  ): Promise<UserContextType['user']> => {
    setIsLoginInFlight(true);
    try {
      const result = await props.fetchSignIn(email, password);
      setIsLoginInFlight(false);
      return result;
    } catch (error) {
      console.error(error);
      setIsLoginInFlight(false);
      if (error && error.code === 'NotAuthorizedException') {
        setIsInvalidCredentials(true);
      }

      if (error && error.code === 'UserNotConfirmedException' && showForm) {
        showForm(AUTH_FORMS.confirmEmail);
      }
      return error;
    }
  };

  const onFormFinish = async (values: FormValues): Promise<void> => {
    const { email, password } = values;
    const signInResult = await handleSignIn(email, password);

    if (onSuccess) {
      onSuccess(signInResult);
    }
    if (redirectTo) {
      router.push(redirectTo);
    }
  };

  return (
    <Fragment>
      <Form
        className={css.form}
        form={form}
        name="horizontal_login"
        layout="vertical"
        onFinish={onFormFinish}
        initialValues={{
          email: seedEmail || undefined,
          password: seedPassword || undefined,
        }}
        onValuesChange={({ email, password }): void =>
          props.updateSeedValues({ email, password })
        }
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
                data-testid="submitButton"
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
