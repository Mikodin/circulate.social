import { Fragment, PureComponent } from 'react';
import { withRouter } from 'next/router';
import type { NextRouter } from 'next/router';
import { ZonedDateTime } from '@js-joda/core';
import { Button } from 'antd';
import '@js-joda/timezone';

import Register, {
  FormValues as RegisterFormValues,
} from './register/Register';
import ConfirmEmail, {
  FormValues as ConfirmEmailFormValues,
} from './confirmEmail/ConfirmEmail';
import Login, { FormValues as LoginFormValues } from './login/Login';
import ForgotPassword, {
  FormValues as ForgotPasswordFormValues,
} from './forgotPassword/ForgotPassword';
import css from './AuthContainer.module.scss';
import UserContext from '../../state-management/UserContext';

export enum AUTH_FORMS {
  login = 'login',
  register = 'register',
  confirmEmail = 'confirmEmail',
  forgotPassword = 'forgotPassword',
}
interface State {
  seedEmail: string;
  seedPassword: string;
  formToShow: AUTH_FORMS;
}
interface Props {
  router: NextRouter;
  onLoginRedirectTo?: string;
  // eslint-disable-next-line
  onLoginSuccess?: (result?: any) => void;

  onRegisterRedirectTo?: string;
  // eslint-disable-next-line
  onRegisterSuccess?: (result?: any) => void;

  onConfirmEmailRedirectTo?: string;
  // eslint-disable-next-line
  onConfirmEmailSuccess?: (result?: any) => void;

  onForgotPasswordRedirectTo?: string;
  // eslint-disable-next-line
  onForgotPasswordSuccess?: (result?: any) => void;

  seedForm?: AUTH_FORMS;
}
class AuthContainer extends PureComponent<Props, State> {
  static contextType = UserContext;

  context: React.ContextType<typeof UserContext>;

  state = {
    seedEmail: '',
    seedPassword: '',
    formToShow: AUTH_FORMS.register,
  };

  componentDidMount(): void {
    const { seedForm } = this.props;
    this.showForm(seedForm);
  }

  showForm = (form: AUTH_FORMS): void => {
    switch (form) {
      case AUTH_FORMS.login: {
        this.setState({
          formToShow: AUTH_FORMS.login,
        });
        break;
      }
      case AUTH_FORMS.register: {
        this.setState({
          formToShow: AUTH_FORMS.register,
        });
        break;
      }
      case AUTH_FORMS.confirmEmail: {
        this.setState({
          formToShow: AUTH_FORMS.confirmEmail,
        });
        break;
      }
      case AUTH_FORMS.forgotPassword: {
        this.setState({
          formToShow: AUTH_FORMS.forgotPassword,
        });
        break;
      }
      default: {
        break;
      }
    }
  };

  updateSeedValues = (formValues: {
    email?: string;
    password?: string;
  }): void => {
    const { email, password } = formValues;
    const { seedEmail, seedPassword } = this.state;
    this.setState({
      seedEmail: email || seedEmail,
      seedPassword: password || seedPassword,
    });
  };

  onRegisterFormCompletion = async (
    formValues: RegisterFormValues
  ): Promise<void> => {
    const { onRegisterRedirectTo, router } = this.props;
    this.updateSeedValues({
      email: formValues.email,
      password: formValues.password,
    });
    this.showForm(AUTH_FORMS.confirmEmail);

    if (onRegisterRedirectTo) {
      router.push(onRegisterRedirectTo);
    }
  };

  onConfirmEmailFormCompletion = async (
    formValues: ConfirmEmailFormValues
  ): Promise<void> => {
    const { email, firstName, lastName } = formValues;
    const userTimezone = ZonedDateTime.now().zone().toString();
    const { seedPassword } = this.state;
    const { onConfirmEmailRedirectTo, router, onRegisterSuccess } = this.props;
    if (seedPassword) {
      try {
        // This is GROSS.  But it happens because the PostAuthentication trigger happens on login
        // And updateUserAttributes needs a user in local storage, which Login gives
        await this.context.signIn(email, seedPassword);
        await this.context.updateUserAttributes(
          firstName,
          lastName,
          userTimezone
        );
        await this.context.signIn(email, seedPassword);
      } catch (error) {
        console.error(error);
        this.showForm(AUTH_FORMS.login);
      }
    } else {
      this.showForm(AUTH_FORMS.login);
    }

    if (onRegisterSuccess) {
      await onRegisterSuccess();
    }

    if (onConfirmEmailRedirectTo) {
      router.push(onConfirmEmailRedirectTo);
    }
  };

  onLoginFormCompletion = async (
    formValues: LoginFormValues
  ): Promise<void> => {
    const { router, onLoginRedirectTo, onLoginSuccess } = this.props;
    this.updateSeedValues({
      email: formValues.email,
      password: formValues.password,
    });

    if (onLoginSuccess) {
      await onLoginSuccess();
    }

    if (onLoginRedirectTo) {
      router.push(onLoginRedirectTo);
    }
  };

  onForgotPasswordCompletion = async (
    formValues: ForgotPasswordFormValues
  ): Promise<void> => {
    const {
      router,
      onForgotPasswordRedirectTo,
      onForgotPasswordSuccess,
    } = this.props;
    const { email, password } = formValues;
    this.updateSeedValues({
      email,
      password,
    });

    if (email && password) {
      await this.context.signIn(email, password);
    }

    if (onForgotPasswordSuccess) {
      await onForgotPasswordSuccess();
    }

    if (onForgotPasswordRedirectTo) {
      router.push(onForgotPasswordRedirectTo);
    }
  };

  render(): JSX.Element {
    const { seedEmail, seedPassword, formToShow } = this.state;
    const shouldShowLoginOption =
      formToShow === AUTH_FORMS.register ||
      formToShow === AUTH_FORMS.confirmEmail;

    // const shouldShowRegisterOption =
    //   formToShow === AUTH_FORMS.login ||
    //   formToShow === AUTH_FORMS.forgotPassword;

    return (
      <>
        {shouldShowLoginOption && (
          <>
            <Button
              className={css.switchToSignInFormButton}
              size="large"
              type="default"
              onClick={(): void => this.showForm(AUTH_FORMS.login)}
            >
              👋 Already registered? Sign in!
            </Button>
          </>
        )}

        <div className={css.container}>
          {formToShow === AUTH_FORMS.register && (
            <Fragment>
              <div className={css.formTagline}>
                <h2>Sign up</h2>
                <span>Be in Circulation</span>
                <hr />
              </div>
              <Register
                seedEmail={seedEmail}
                seedPassword={seedPassword}
                updateSeedValues={this.updateSeedValues}
                fetchRegister={this.context.register}
                onFormCompletionCallback={this.onRegisterFormCompletion}
              />
            </Fragment>
          )}
          {formToShow === AUTH_FORMS.confirmEmail && (
            <Fragment>
              <div className={css.formTagline}>
                <h2>✉️ Confirm your email</h2>
                <hr />
              </div>
              <ConfirmEmail
                seedEmail={seedEmail}
                fetchConfirmEmail={this.context.confirmEmail}
                fetchResendConfirmEmail={this.context.resendRegisterCode}
                onFormCompletionCallback={this.onConfirmEmailFormCompletion}
                updateSeedValues={this.updateSeedValues}
              />
            </Fragment>
          )}
          {formToShow === AUTH_FORMS.login && (
            <Fragment>
              <div className={css.formTagline}>
                <h2>Sign in</h2>
                <span>Welcome back</span>
                <hr />
              </div>
              <Login
                seedEmail={seedEmail}
                seedPassword={seedPassword}
                fetchSignIn={this.context.signIn}
                onFormCompletionCallback={this.onLoginFormCompletion}
                updateSeedValues={this.updateSeedValues}
                showForm={this.showForm}
              />
              <p onClick={(): void => this.showForm(AUTH_FORMS.forgotPassword)}>
                Forgot password?
              </p>
              <p onClick={(): void => this.showForm(AUTH_FORMS.register)}>
                Not a member? Sign up!
              </p>
            </Fragment>
          )}
          {formToShow === AUTH_FORMS.forgotPassword && (
            <Fragment>
              <div className={css.formTagline}>
                <h2>Forgot password</h2>
                <hr />
              </div>
              <ForgotPassword
                fetchInitForgotPassword={this.context.forgotPasswordInit}
                fetchFinalizeForgotPassword={this.context.forgotPasswordSubmit}
                seedEmail={seedEmail}
                updateSeedValues={this.updateSeedValues}
                onFormCompletionCallback={this.onForgotPasswordCompletion}
              />
              <p onClick={(): void => this.showForm(AUTH_FORMS.register)}>
                Not a member? Sign up!
              </p>
            </Fragment>
          )}
          {/* <p onClick={() => this.showForm(AUTH_FORMS.confirmEmail)}>
          Confirming Email?
        </p> */}
        </div>
      </>
    );
  }
}

export default withRouter(AuthContainer);
