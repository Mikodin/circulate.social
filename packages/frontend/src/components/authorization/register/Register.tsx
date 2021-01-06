import { useState, Fragment } from 'react';
import { Form, Input, Button, Alert } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import Link from 'next/link';

import type { UserContextType } from '../../../state-management/UserContext';
import css from './Register.module.scss';

export interface FormValues {
  email: string;
  password: string;
}

export interface Props {
  fetchRegister: UserContextType['register'];
  onFormCompletionCallback: (formValues: Partial<FormValues>) => Promise<void>;
  seedEmail?: string;
  seedPassword?: string;
  updateSeedValues?: (userValues: {
    email?: string;
    password?: string;
  }) => void;
}

const Register = (props: Props): JSX.Element => {
  const [form] = Form.useForm();

  const {
    fetchRegister,
    seedEmail,
    seedPassword,
    updateSeedValues,
    onFormCompletionCallback,
  } = props;
  const [isRegisterInFlight, setIsRegisterInFlight] = useState(false);
  const [isUserAlreadyExistsError, setIsUserAlreadyExistsError] = useState(
    false
  );
  const [isPasswordTooWeakError, setIsPasswordTooWeakError] = useState(false);

  const onFinish = async (values: FormValues): Promise<void> => {
    const { email, password } = values;
    try {
      setIsRegisterInFlight(true);

      await fetchRegister(email, password);

      setIsUserAlreadyExistsError(false);
      setIsRegisterInFlight(false);

      await onFormCompletionCallback({ email, password });
    } catch (error) {
      console.error(error);
      if (error.code === 'UsernameExistsException') {
        setIsUserAlreadyExistsError(true);
      }
      if (error.code === 'InvalidParameterException') {
        setIsPasswordTooWeakError(true);
      }
      if (error.code === 'InvalidPasswordException') {
        setIsPasswordTooWeakError(true);
      }
      setIsRegisterInFlight(false);
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
          password: seedPassword || undefined,
        }}
        onValuesChange={({ email, password }): void => {
          if (email) {
            setIsUserAlreadyExistsError(false);
          }
          if (password) {
            setIsPasswordTooWeakError(false);
          }
          updateSeedValues({ email, password });
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
            placeholder="joedoe@gmail.com"
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
            prefix={<LockOutlined className="site-form-item-icon" />}
            autoComplete="new-password"
            type="password"
            placeholder="Password"
          />
        </Form.Item>
        <Alert
          message="Use 8 or more characters containing a mix of casing, letters, and numbers."
          type="info"
          showIcon
          closable
          banner
          style={{ marginBottom: '10px', marginTop: '-10px' }}
        />
        {/* TODO Add more errors for different password issues */}
        {isPasswordTooWeakError && (
          <Alert
            message="Your password is too weak. It must have atleast 8 characters, a capital letter, a number, and a symbol."
            type="error"
            showIcon
          />
        )}
        {isUserAlreadyExistsError && (
          <Alert
            message="Sorry, a user with this email already exists."
            type="error"
            showIcon
          />
        )}
        <Form.Item shouldUpdate={true}>
          {(): JSX.Element => {
            const isEmailTouched =
              form.isFieldTouched('email') ||
              Boolean(form.getFieldValue('email'));
            const isPasswordTouched = form.isFieldTouched('password');
            const isFormTouched = isPasswordTouched && isEmailTouched;
            return (
              <Button
                data-testid="submitButton"
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
      <small>
        By clicking &quot;Sign Up&quot;, you agree to Circulate&apos;s{' '}
        <Link href="terms" prefetch={false}>
          Terms of Service.
        </Link>
      </small>
    </Fragment>
  );
};

export default Register;
