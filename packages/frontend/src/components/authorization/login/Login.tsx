import { useState, Fragment } from 'react';
import { Form, Input, Button, Alert } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';

import { AUTH_FORMS } from '../AuthContainer';
import { UserContextType } from '../../../state-management/UserContext';
import css from './Login.module.scss';

export interface FormValues {
  email: string;
  password: string;
}
export interface Props {
  seedEmail?: string;
  seedPassword?: string;
  // eslint-disable-next-line
  onSuccess?: (result?: any) => void;
  showForm?: (form: AUTH_FORMS) => void;
  fetchSignIn?: UserContextType['signIn'];
  updateSeedValues?: (userValues: {
    email?: string;
    password?: string;
  }) => void;
  onFormCompletionCallback: (formValues: Partial<FormValues>) => Promise<void>;
}
const Login = (props: Props): JSX.Element => {
  const { seedEmail, seedPassword, showForm, onFormCompletionCallback } = props;

  const [form] = Form.useForm();

  const [isInvalidCredentials, setIsInvalidCredentials] = useState(false);
  const [isNetworkError, setIsNetworkError] = useState(false);
  const [isUnknownError, setIsUnknownError] = useState(false);

  const [isLoginInFlight, setIsLoginInFlight] = useState(false);

  const handleSignIn = async (
    email: string,
    password: string
  ): Promise<UserContextType['user']> => {
    setIsLoginInFlight(true);
    try {
      const result = await props.fetchSignIn(email, password);
      setIsInvalidCredentials(false);
      setIsLoginInFlight(false);
      return result;
    } catch (error) {
      console.error(error);
      setIsLoginInFlight(false);

      const isNotAuthorizedException =
        error && error.code === 'NotAuthorizedException';
      if (isNotAuthorizedException) {
        setIsInvalidCredentials(true);
      }

      const isNetworkErrorCode = error && error.code === 'NetworkError';
      if (isNetworkErrorCode) {
        setIsNetworkError(true);
      }

      const isUserNotConfirmedException =
        error && error.code === 'UserNotConfirmedException';
      if (isUserNotConfirmedException && showForm) {
        showForm(AUTH_FORMS.confirmEmail);
      }

      if (!isNotAuthorizedException && !isNetworkErrorCode) {
        setIsUnknownError(true);
      }

      return error;
    }
  };

  const onFormFinish = async (values: FormValues): Promise<void> => {
    const { email, password } = values;
    const signInResult = await handleSignIn(email, password);
    if (signInResult.email) {
      await onFormCompletionCallback({ email, password });
    }
  };

  return (
    <Fragment>
      <Form
        className={css.form}
        form={form}
        name="horizontal_login"
        size="large"
        layout="vertical"
        onFinish={onFormFinish}
        initialValues={{
          email: seedEmail || undefined,
          password: seedPassword || undefined,
        }}
        onValuesChange={({ email, password }): void => {
          if (email || password) {
            setIsInvalidCredentials(false);
          }
          props.updateSeedValues({ email, password });
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
            autoComplete="email"
            type="email"
          />
        </Form.Item>
        <Form.Item
          name="password"
          rules={[{ required: true, message: 'Please input your password' }]}
          label="Password"
        >
          <Input.Password
            visibilityToggle
            autoComplete="current-password"
            prefix={<LockOutlined className="site-form-item-icon" />}
            type="password"
            placeholder="Password"
          />
        </Form.Item>

        {isInvalidCredentials && (
          <Alert message="Invalid username or password" type="error" showIcon />
        )}

        {isNetworkError && (
          <Alert
            message="Sorry, we couldn't connect to our server. Please try again."
            type="error"
            showIcon
          />
        )}
        {isUnknownError && (
          <Alert
            message="Sorry, something unknown went wrong. Please try again."
            type="error"
            showIcon
          />
        )}

        <Form.Item shouldUpdate={true}>
          {(): JSX.Element => {
            const isEmailTouched =
              form.isFieldTouched('email') ||
              Boolean(form.getFieldValue('email'));
            const isPasswordTouched =
              form.isFieldTouched('password') ||
              Boolean(form.getFieldValue('password'));
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
