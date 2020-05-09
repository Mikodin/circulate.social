import { useState, Fragment, useContext } from 'react';
import { useRouter } from 'next/router';
import { Form, Input, Button, Alert } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';

import { AUTH_FORMS } from '../authContainer/AuthContainer';
import UserContext from '../../../state-management/UserContext';
import css from './ForgotPassword.module.scss';

interface Props {
  seedEmailAddress?: string;
  redirectTo?: string;
  // eslint-disable-next-line
  onSuccess?: (result?: any) => void;
  showForm?: (form: AUTH_FORMS) => void;
}
const ForgotPassword = (props: Props): JSX.Element => {
  const router = useRouter();
  const { forgotPasswordInit, forgotPasswordSubmit } = useContext(UserContext);
  const [form] = Form.useForm();

  const { redirectTo, onSuccess, seedEmailAddress } = props;
  const [isInvalidCredentials, setIsInvalidCredentials] = useState(false);
  const [showConfirmationCode, setShowConfirmationCode] = useState(false);
  const [showLimitError, setShowLimitError] = useState(false);
  const [isLoginInFlight] = useState(false);

  interface FormValues {
    email: string;
    newPassword: string;
    confirmationCode: string;
  }
  const onFinish = async (values: FormValues): Promise<void> => {
    const { email, newPassword, confirmationCode } = values;
    try {
      let result;
      if (showConfirmationCode) {
        result = await forgotPasswordSubmit(
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
        result = await forgotPasswordInit(email);
        setShowConfirmationCode(true);
      }
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
          email: seedEmailAddress || undefined,
          newPassword: undefined,
          confirmationCode: undefined,
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
            autoComplete="email"
            placeholder="johndoe@gmail.com"
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
                forgotPasswordInit(form.getFieldValue('email'));
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
