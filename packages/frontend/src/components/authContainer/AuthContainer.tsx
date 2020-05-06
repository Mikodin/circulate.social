import { Fragment, PureComponent } from 'react';
import Register from '../register/Register';
import ConfirmEmail from '../confirmEmail/ConfirmEmail';
import Login from '../login/Login';
import ForgotPassword from '../forgotPassword/ForgotPassword';
import css from './AuthContainer.module.scss';

export enum AUTH_FORMS {
  'login',
  'register',
  'confirmEmail',
  'forgotPassword',
}
interface State {
  showRegisterForm: boolean;
  showConfirmEmailForm: boolean;
  showLoginForm: boolean;
  showForgotPasswordForm: boolean;
  userEmailAddress: string | undefined;
}
interface Props {
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
  state = {
    showRegisterForm: true,
    showConfirmEmailForm: false,
    showLoginForm: false,
    userEmailAddress: undefined,
    showForgotPasswordForm: false,
  };

  componentDidMount(): void {
    const { seedForm } = this.props;
    this.showForm(seedForm);
  }

  showForm = (form: AUTH_FORMS): void => {
    switch (form) {
      case AUTH_FORMS.login: {
        this.setState({
          showLoginForm: true,
          showRegisterForm: false,
          showConfirmEmailForm: false,
          showForgotPasswordForm: false,
        });
        break;
      }
      case AUTH_FORMS.register: {
        this.setState({
          showRegisterForm: true,
          showConfirmEmailForm: false,
          showLoginForm: false,
          showForgotPasswordForm: false,
        });
        break;
      }
      case AUTH_FORMS.confirmEmail: {
        this.setState({
          showConfirmEmailForm: true,
          showLoginForm: false,
          showRegisterForm: false,
          showForgotPasswordForm: false,
        });
        break;
      }
      case AUTH_FORMS.forgotPassword: {
        this.setState({
          showForgotPasswordForm: true,
          showRegisterForm: false,
          showConfirmEmailForm: false,
          showLoginForm: false,
        });
        break;
      }
      default: {
        break;
      }
    }
  };

  render(): JSX.Element {
    const {
      userEmailAddress,
      showConfirmEmailForm,
      showLoginForm,
      showRegisterForm,
      showForgotPasswordForm,
    } = this.state;
    const {
      onLoginRedirectTo,
      onLoginSuccess,
      onRegisterRedirectTo,
      onConfirmEmailRedirectTo,
    } = this.props;

    return (
      <div className={css.container}>
        {showRegisterForm && (
          <Fragment>
            <Register
              redirectTo={onRegisterRedirectTo}
              onSuccess={(vals): void => {
                if (vals && vals.email) {
                  this.setState({ userEmailAddress: vals.email });
                }
                this.showForm(AUTH_FORMS.confirmEmail);
              }}
            />
            <p onClick={(): void => this.showForm(AUTH_FORMS.login)}>
              Already a member? Sign in!
            </p>
          </Fragment>
        )}
        {showConfirmEmailForm && (
          <Fragment>
            <ConfirmEmail
              redirectTo={onConfirmEmailRedirectTo}
              onSuccess={(): void => this.showForm(AUTH_FORMS.login)}
              seedEmailAddress={userEmailAddress}
            />
            <p onClick={(): void => this.showForm(AUTH_FORMS.login)}>
              Already a member? Sign in
            </p>
          </Fragment>
        )}
        {showLoginForm && (
          <Fragment>
            <Login
              seedEmailAddress={userEmailAddress}
              redirectTo={onLoginRedirectTo}
              onSuccess={onLoginSuccess}
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
        {showForgotPasswordForm && (
          <Fragment>
            <ForgotPassword
              seedEmailAddress={userEmailAddress}
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

export default AuthContainer;
