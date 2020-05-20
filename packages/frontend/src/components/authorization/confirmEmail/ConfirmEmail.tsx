import { useState, Fragment } from 'react';
import { useRouter } from 'next/router';
import { Form, Input, Button, Alert } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import type { ConfirmSignUp } from '../../../types/amplify.d';

import { AUTH_FORMS } from '../AuthContainer';
import css from './ConfirmEmail.module.scss';

export interface Props {
  fetchConfirmEmail: (
    username: string,
    code: string,
    routeOnSuccess?: string
  ) => Promise<ConfirmSignUp>;
  fetchResendConfirmEmail: (username: string) => Promise<boolean>;
  updateSeedValues?: (userValues: { email?: string }) => void;
  // eslint-disable-next-line
  onSuccess?: (result?: any) => void;
  showForm?: (form: AUTH_FORMS) => void;
  seedEmail?: string;
  redirectTo?: string;
}

const ConfirmEmail = (props: Props): JSX.Element => {
  const router = useRouter();
  const [form] = Form.useForm();

  const {
    redirectTo,
    onSuccess,
    seedEmail,
    fetchConfirmEmail,
    fetchResendConfirmEmail,
  } = props;
  const [isInvalidCredentials, setIsInvalidCredentials] = useState(false);
  const [isLoginInFlight, setIsLoginInFlight] = useState(false);

  interface FormValues {
    email: string;
    confirmationCode: string;
  }
  const onFinish = async (values: FormValues): Promise<void> => {
    const { email, confirmationCode } = values;
    try {
      setIsLoginInFlight(true);
      const result = await fetchConfirmEmail(email, confirmationCode);
      if (onSuccess) {
        onSuccess(result);
      }

      if (redirectTo) {
        router.push(redirectTo);
        return;
      }

      setIsLoginInFlight(false);
    } catch (error) {
      console.error(error);
      console.log('We here boii');
      setIsLoginInFlight(false);
      if (error.code) {
        setIsInvalidCredentials(true);
      }
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
        }}
        onValuesChange={({ email }): void => props.updateSeedValues({ email })}
      >
        <Form.Item
          name="email"
          rules={[{ required: true, message: 'Please input your email' }]}
          label="Email Address"
        >
          <Input
            autoComplete="email"
            prefix={<MailOutlined className="site-form-item-icon" />}
            placeholder="joedoe@gmail.com"
            type="email"
          />
        </Form.Item>
        <Form.Item
          name="confirmationCode"
          rules={[
            {
              required: true,
              message: 'Please input the confirmation code emailed to you',
            },
          ]}
          label="Confirmation Code"
        >
          <Input
            autoComplete="one-time-code"
            prefix={<LockOutlined className="site-form-item-icon" />}
            placeholder="123456"
          />
        </Form.Item>

        {isInvalidCredentials && (
          <Alert
            message="Invalid verification code provided, please try again."
            type="error"
            showIcon
          />
        )}
        <a
          onClick={(): void => {
            fetchResendConfirmEmail(form.getFieldValue('email'));
          }}
        >
          {"Didn't receive the code? Resend it"}
        </a>
        <Form.Item shouldUpdate={true}>
          {(): JSX.Element => {
            const isEmailTouched =
              form.isFieldTouched('email') ||
              Boolean(form.getFieldValue('email'));
            const isConfirmationCodeTouched = form.isFieldTouched(
              'confirmationCode'
            );
            const isFormTouched = isEmailTouched && isConfirmationCodeTouched;
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
                {isLoginInFlight ? 'Confirming' : 'Confirm Email'}
              </Button>
            );
          }}
        </Form.Item>
      </Form>
    </Fragment>
  );
};

export default ConfirmEmail;
