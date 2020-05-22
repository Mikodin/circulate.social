import { useState, Fragment } from 'react';
import { useRouter } from 'next/router';
import { Form, Input, Button, Alert } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';

import type { UserContextType } from '../../../state-management/UserContext';
import css from './Register.module.scss';

export interface FormValues {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface Props {
  fetchRegister: (
    username: string,
    password: string,
    firstName: string,
    lastName: string
  ) => Promise<UserContextType['user']>;
  onFormCompletionCallback: (formValues: Partial<FormValues>) => Promise<void>;
  seedEmail?: string;
  seedPassword?: string;
  redirectTo?: string;
  updateSeedValues?: (userValues: {
    email?: string;
    password?: string;
  }) => void;
}

const Register = (props: Props): JSX.Element => {
  const router = useRouter();
  const [form] = Form.useForm();

  const {
    fetchRegister,
    redirectTo,
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
    const { email, password, firstName, lastName } = values;
    try {
      setIsRegisterInFlight(true);

      await fetchRegister(email, password, firstName, lastName);

      setIsUserAlreadyExistsError(false);
      setIsRegisterInFlight(false);

      await onFormCompletionCallback({ email, password });

      if (redirectTo) {
        router.push(redirectTo);
        return;
      }
    } catch (error) {
      console.error(error);
      if (error.code === 'UsernameExistsException') {
        setIsUserAlreadyExistsError(true);
      }
      if (error.code === 'InvalidParameterException') {
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
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          firstName: undefined,
          lastName: undefined,
          email: seedEmail || undefined,
          password: seedPassword || undefined,
        }}
        onValuesChange={({ email, password }): void =>
          updateSeedValues({ email, password })
        }
      >
        <Form.Item
          name="firstName"
          rules={[{ required: true, message: 'Please input name' }]}
          label="First name"
        >
          <Input
            prefix={<UserOutlined className="site-form-item-icon" />}
            autoComplete="given-name"
            placeholder="John"
          />
        </Form.Item>
        <Form.Item
          name="lastName"
          rules={[{ required: true, message: 'Please input your last name' }]}
          label="Last name"
        >
          <Input
            autoComplete="family-name"
            prefix={<UserOutlined className="site-form-item-icon" />}
            placeholder="Doe"
          />
        </Form.Item>
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
          <Input
            prefix={<LockOutlined className="site-form-item-icon" />}
            autoComplete="new-password"
            type="password"
            placeholder="Password"
          />
        </Form.Item>

        {/* TODO Add more errors for different password issues */}
        {isPasswordTooWeakError && (
          <Alert
            message="Value at 'password' failed to satisfy constraint: Member must have length greater than or equal to 6; Value at 'password' failed to satisfy constraint: Member must satisfy regular expression pattern: ^[\\S]+.*[\\S]+$"
            // message="Value at"
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
            const isFirstNameTouched = form.isFieldTouched('firstName');
            const isLastNameTouched = form.isFieldTouched('lastName');
            const isPasswordTouched = form.isFieldTouched('password');
            const isFormTouched =
              isFirstNameTouched &&
              isLastNameTouched &&
              isPasswordTouched &&
              isEmailTouched;
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
    </Fragment>
  );
};

export default Register;
