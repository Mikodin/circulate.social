import { useState, Fragment, useContext } from 'react';
import { useRouter } from 'next/router';
import { Form, Input, Button, Alert } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';

import { AUTH_FORMS } from '../authContainer/AuthContainer';
import UserContext from '../../state-management/UserContext';
import css from './ConfirmEmail.module.scss';

interface Props {
  seedEmailAddress?: string;
  redirectTo?: string;
  // eslint-disable-next-line
  onSuccess?: (result?: any) => void;
  showForm?: (form: AUTH_FORMS) => void;
}
const ConfirmEmail = (props: Props): JSX.Element => {
  const router = useRouter();
  const { confirmEmail, resendRegisterCode } = useContext(UserContext);
  const [form] = Form.useForm();

  const { redirectTo, onSuccess, seedEmailAddress } = props;
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
      const result = await confirmEmail(email, confirmationCode);
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
            autoComplete="email"
            prefix={<MailOutlined className="site-form-item-icon" />}
            placeholder="johndoe@gmail.com"
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
            resendRegisterCode(form.getFieldValue('email'));
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
