import { useState, Fragment } from 'react';
import { Form, Input, Button, Alert } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';

import { AUTH_FORMS } from '../AuthContainer';
import css from './ForgotPassword.module.scss';

export interface FormValues {
  email: string;
  password: string;
  confirmationCode: string;
}
export interface Props {
  fetchInitForgotPassword: (username: string) => Promise<boolean>;
  fetchFinalizeForgotPassword: (
    username: string,
    code: string,
    password: string
  ) => Promise<boolean>;
  // eslint-disable-next-line
  showForm?: (form: AUTH_FORMS) => void;
  updateSeedValues?: (userValues: {
    email?: string;
    password?: string;
  }) => void;
  seedEmail?: string;
  onFormCompletionCallback: (formValues: Partial<FormValues>) => Promise<void>;
}

const ForgotPassword = (props: Props): JSX.Element => {
  const [form] = Form.useForm();

  const {
    fetchInitForgotPassword,
    fetchFinalizeForgotPassword,
    seedEmail,
    onFormCompletionCallback,
  } = props;
  const [isCodeMismatchError, setIsCodeMismatchError] = useState(false);
  const [isExpiredCodeError, setIsExpiredCodeError] = useState(false);
  const [showLimitError, setShowLimitError] = useState(false);
  const [isInvalidParameterError, setIsInvalidParameterError] = useState(false);

  const [showConfirmationCode, setShowConfirmationCode] = useState(false);
  const [isForgotPasswordInFlight, setIsForgotPasswordInFlight] = useState(
    false
  );

  const onFinish = async (values: FormValues): Promise<void> => {
    const { email, password, confirmationCode } = values;
    try {
      setIsForgotPasswordInFlight(true);

      if (showConfirmationCode) {
        await fetchFinalizeForgotPassword(email, confirmationCode, password);
        onFormCompletionCallback({ email, password });
      } else {
        await fetchInitForgotPassword(email);
        setShowConfirmationCode(true);
      }

      setShowLimitError(false);
      setIsInvalidParameterError(false);
      setIsCodeMismatchError(false);
      setIsForgotPasswordInFlight(false);
    } catch (error) {
      setIsForgotPasswordInFlight(false);
      console.error(error);
      if (error && error.code === 'LimitExceededException') {
        setShowLimitError(true);
      }
      if (error && error.code === 'ExpiredCodeException') {
        setIsExpiredCodeError(true);
      }
      if (error && error.code === 'CodeMismatchException') {
        setIsCodeMismatchError(true);
      }
      if (error && error.code === 'InvalidParameterException') {
        setIsInvalidParameterError(true);
      }
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
        onFinish={onFinish}
        initialValues={{
          email: seedEmail || undefined,
          password: undefined,
          confirmationCode: undefined,
        }}
        onValuesChange={({ email, password, confirmationCode }): void => {
          if (password) {
            setIsInvalidParameterError(false);
          }
          if (confirmationCode) {
            setIsCodeMismatchError(false);
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
            autoComplete="email"
            placeholder="joedoe@gmail.com"
            type="email"
          />
        </Form.Item>
        {showConfirmationCode && (
          <Fragment>
            <Form.Item
              name="password"
              rules={[
                { required: true, message: 'Please input a new password' },
              ]}
              label="New password"
            >
              <Input.Password
                visibilityToggle
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
                placeholder="123456"
              />
            </Form.Item>
            <a
              onClick={(): void => {
                fetchInitForgotPassword(form.getFieldValue('email'));
              }}
            >
              {isForgotPasswordInFlight
                ? 'Sending...'
                : "Didn't receive the code? Resend it"}
            </a>
          </Fragment>
        )}
        {isCodeMismatchError && (
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
        {isExpiredCodeError && (
          <Alert
            message="The code provided has expired.  Please try again."
            type="error"
            showIcon
          />
        )}
        {isInvalidParameterError && (
          <Alert
            message="Your password is too weak. It must have atleast 8 characters, a capital letter, a number, and a symbol."
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
                loading={isForgotPasswordInFlight}
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
                {isForgotPasswordInFlight ? 'Submitting...' : 'Submit'}
              </Button>
            );
          }}
        </Form.Item>
      </Form>
    </Fragment>
  );
};

export default ForgotPassword;
