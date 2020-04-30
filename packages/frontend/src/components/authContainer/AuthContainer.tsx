import { Fragment, PureComponent } from 'react';
import Register from '@components/register/Register';
import ConfirmEmail from '@components/confirmEmail/ConfirmEmail';
import Login from '@components/login/Login';
import css from './authContainer.module.scss';
import ForgotPassword from '@components/forgotPassword/ForgotPassword';

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
  onLoginSuccess?: (x: any) => any;

  onRegisterRedirectTo?: string;
  onRegisterSuccess?: (x: any) => any;

  onConfirmEmailRedirectTo?: string;
  onConfirmEmailSuccess?: (x: any) => any;

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

  componentDidMount() {
    const { seedForm } = this.props;
    this.showForm(seedForm);
  }

  showForm = (form: AUTH_FORMS) => {
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
    }
  };
  render() {
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
      onRegisterSuccess,
      onConfirmEmailRedirectTo,
      onConfirmEmailSuccess,
    } = this.props;

    return (
      <div className={css.container}>
        {showRegisterForm && (
          <Fragment>
            <Register
              redirectTo={onRegisterRedirectTo}
              onSuccess={(vals) => {
                if (vals && vals.email) {
                  this.setState({ userEmailAddress: vals.email });
                }
                this.showForm(AUTH_FORMS.confirmEmail);
              }}
            />
            <p onClick={() => this.showForm(AUTH_FORMS.login)}>
              Already a member? Sign in!
            </p>
          </Fragment>
        )}
        {showConfirmEmailForm && (
          <Fragment>
            <ConfirmEmail
              redirectTo={onConfirmEmailRedirectTo}
              onSuccess={() => this.showForm(AUTH_FORMS.login)}
              seedEmailAddress={userEmailAddress}
            />
            <p onClick={() => this.showForm(AUTH_FORMS.login)}>
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
            <p onClick={() => this.showForm(AUTH_FORMS.forgotPassword)}>
              Forgot password?
            </p>
            <p onClick={() => this.showForm(AUTH_FORMS.register)}>
              Not a member? Sign up!
            </p>
          </Fragment>
        )}
        {showForgotPasswordForm && (
          <Fragment>
            <ForgotPassword
              seedEmailAddress={userEmailAddress}
              onSuccess={() => this.showForm(AUTH_FORMS.login)}
            />
            <p onClick={() => this.showForm(AUTH_FORMS.register)}>
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
