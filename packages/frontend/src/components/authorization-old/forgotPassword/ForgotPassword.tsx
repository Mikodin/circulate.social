import { useState, Fragment } from 'react';
import { useRouter } from 'next/router';
import { Form, Input, Button, Alert } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';

import { AUTH_FORMS } from '../AuthContainer';
import css from './ForgotPassword.module.scss';

export interface Props {
  fetchInitForgotPassword: (username: string) => Promise<boolean>;
  fetchFinalizeForgotPassword: (
    username: string,
    newPassword: string,
    code: string
  ) => Promise<boolean>;
  // eslint-disable-next-line
  onSuccess?: (result?: any) => void;
  showForm?: (form: AUTH_FORMS) => void;
  updateSeedValues?: (userValues: { email?: string }) => void;
  seedEmail?: string;
  redirectTo?: string;
}

const ForgotPassword = (props: Props): JSX.Element => {
  const router = useRouter();
  const [form] = Form.useForm();

  const {
    fetchInitForgotPassword,
    fetchFinalizeForgotPassword,
    redirectTo,
    onSuccess,
    seedEmail,
  } = props;
  const [isInvalidCredentials, setIsInvalidCredentials] = useState(false);
  const [showConfirmationCode, setShowConfirmationCode] = useState(false);
  const [showLimitError, setShowLimitError] = useState(false);
  const [isLoginInFlight, setIsLoginInFlight] = useState(false);

  interface FormValues {
    email: string;
    newPassword: string;
    confirmationCode: string;
  }
  const onFinish = async (values: FormValues): Promise<void> => {
    const { email, newPassword, confirmationCode } = values;
    try {
      let result;
      setIsLoginInFlight(true);
      if (showConfirmationCode) {
        result = await fetchFinalizeForgotPassword(
          email,
          confirmationCode,
          newPassword
        );

        if (redirectTo) {
          router.push(redirectTo);
        }

        if (onSuccess) {
          onSuccess(result);
        }
      } else {
        result = await fetchInitForgotPassword(email);
        setShowConfirmationCode(true);
      }

      setIsLoginInFlight(false);
    } catch (error) {
      if (error && error.code === 'LimitExceededException') {
        setShowLimitError(true);
      }
      if (error && error.code === 'ExpiredCodeException') {
        setIsInvalidCredentials(true);
      }
      if (error && error.code === 'CodeMismatchException') {
        setIsInvalidCredentials(true);
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
          email: seedEmail || undefined,
          password: undefined,
          newPassword: undefined,
          confirmationCode: undefined,
        }}
        onValuesChange={({ email }): void => props.updateSeedValues({ email })}
      >
        <Form.Item
          name="email"
          rules={[{ required: true, message: 'Please input your email' }]}
          label="Email Address"
        >
          <Input
            prefix={<MailOutlined className="site-form-item-icon" />}
            autoComplete="email"
            placeholder="joedoe@gmail.com"
            type="email"
          />
        </Form.Item>
        {showConfirmationCode && (
          <Fragment>
            <Form.Item
              name="newPassword"
              rules={[
                { required: true, message: 'Please input a new password' },
              ]}
              label="New password"
            >
              <Input
                prefix={<LockOutlined className="site-form-item-icon" />}
                autoComplete="new-password"
                type="password"
                placeholder="Password"
              />
            </Form.Item>
            <Form.Item
              name="confirmationCode"
              rules={[
                {
                  required: true,
                  message: 'Please input the code emailed to you',
                },
              ]}
              label="Confirmation Code"
            >
              <Input
                prefix={<LockOutlined className="site-form-item-icon" />}
                autoComplete="one-time-code"
                placeholder="Password"
              />
            </Form.Item>
            <a
              onClick={(): void => {
                fetchInitForgotPassword(form.getFieldValue('email'));
              }}
            >
              {"Didn't receive the code? Resend it"}
            </a>
          </Fragment>
        )}
        {isInvalidCredentials && (
          <Alert
            message="Invalid verification code provided, please try again."
            type="error"
            showIcon
          />
        )}
        {showLimitError && (
          <Alert
            message="Attempt limit exceeded, please try after some time."
            type="error"
            showIcon
          />
        )}

        <Form.Item shouldUpdate={true}>
          {(): JSX.Element => {
            const isEmailTouched =
              form.isFieldTouched('email') ||
              Boolean(form.getFieldValue('email'));
            // const isNewPasswordTouched = form.isFieldTouched('newPassword');
            const isFormTouched = isEmailTouched;
            return (
              <Button
                data-testid="submitButton"
                loading={isLoginInFlight}
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
                {isLoginInFlight ? 'Setting New Password' : 'Set New Password'}
              </Button>
            );
          }}
        </Form.Item>
      </Form>
    </Fragment>
  );
};

export default ForgotPassword;
