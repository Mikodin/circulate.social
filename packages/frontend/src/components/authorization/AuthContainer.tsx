import { Fragment, PureComponent } from 'react';
import { withRouter } from 'next/router';
import type { NextRouter } from 'next/router';

import Register from './register/Register';
import ConfirmEmail, {
  FormValues as ConfirmEmailFormValues,
} from './confirmEmail/ConfirmEmail';
import Login from './login/Login';
import ForgotPassword from './forgotPassword/ForgotPassword';
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

  onRegisterFormCompletion = async (): Promise<void> => {
    this.showForm(AUTH_FORMS.confirmEmail);
  };

  onConfirmEmailFormCompletion = async (
    formValues: ConfirmEmailFormValues
  ): Promise<void> => {
    const { seedPassword } = this.state;
    const { onConfirmEmailRedirectTo, router } = this.props;
    if (seedPassword) {
      try {
        await this.context.signIn(formValues.email, this.state.seedPassword);
      } catch (error) {
        console.error(error);
        this.showForm(AUTH_FORMS.login);
      }
    } else {
      this.showForm(AUTH_FORMS.login);
    }

    if (onConfirmEmailRedirectTo) {
      router.push(onConfirmEmailRedirectTo);
    }
  };

  render(): JSX.Element {
    const { seedEmail, seedPassword, formToShow } = this.state;
    const {
      onLoginRedirectTo,
      onLoginSuccess,
      onRegisterRedirectTo,
    } = this.props;

    return (
      <div className={css.container}>
        {formToShow === AUTH_FORMS.register && (
          <Fragment>
            <Register
              seedEmail={seedEmail}
              seedPassword={seedPassword}
              updateSeedValues={this.updateSeedValues}
              fetchRegister={this.context.register}
              redirectTo={onRegisterRedirectTo}
              onFormCompletionCallback={this.onRegisterFormCompletion}
            />
            <p onClick={(): void => this.showForm(AUTH_FORMS.login)}>
              Already a member? Sign in!
            </p>
          </Fragment>
        )}
        {formToShow === AUTH_FORMS.confirmEmail && (
          <Fragment>
            <ConfirmEmail
              seedEmail={seedEmail}
              fetchConfirmEmail={this.context.confirmEmail}
              fetchResendConfirmEmail={this.context.resendRegisterCode}
              onFormCompletionCallback={this.onConfirmEmailFormCompletion}
              updateSeedValues={this.updateSeedValues}
            />
            <p onClick={(): void => this.showForm(AUTH_FORMS.login)}>
              Already a member? Sign in
            </p>
          </Fragment>
        )}
        {formToShow === AUTH_FORMS.login && (
          <Fragment>
            <Login
              seedEmail={seedEmail}
              seedPassword={seedPassword}
              redirectTo={onLoginRedirectTo}
              updateSeedValues={this.updateSeedValues}
              onSuccess={onLoginSuccess}
              showForm={this.showForm}
              fetchSignIn={this.context.signIn}
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
            <ForgotPassword
              fetchInitForgotPassword={this.context.forgotPasswordInit}
              fetchFinalizeForgotPassword={this.context.forgotPasswordSubmit}
              seedEmail={seedEmail}
              updateSeedValues={this.updateSeedValues}
              onSuccess={(): void => this.showForm(AUTH_FORMS.login)}
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
    );
  }
}

export default withRouter(AuthContainer);
