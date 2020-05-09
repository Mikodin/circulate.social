/* eslint @typescript-eslint/no-explicit-any: 0 */

export interface CurrentAuthenticatedUser {
  Session: null;
  attributes: {
    email: string;
    email_verified: boolean;
    family_name: string;
    given_name: string;
    sub: string;
  };
  username: string; // Is the actuaal key in the cognito table
}

export interface ForgotPassword {
  CodeDeliveryDetails: {
    AttributeName: string;
    DeliveryMedium: string;
    Destination: string;
  };
  code?: 'LimitExceededException';
  message?: 'Attempt limit exceeded, please try after some time.';
  name?: 'LimitExceededException';
}

export type ConfirmSignUp =
  | 'SUCCESS'
  | {
      code: 'CodeMismatchException';
      name: 'CodeMismatchException';
      message: 'Invalid verification code provided; please try again.';
    };

export interface ResendSignUp {
  CodeDeliveryDetails: {
    AttributeName: 'email';
    DeliveryMedium: 'EMAIL';
    Destination: 'm***@g***.com';
  };
}

export interface SignUp {
  codeDeliveryDetails: {
    AttributeName: 'email';
    DeliveryMedium: 'EMAIL';
    Destination: string;
  };
  user: {
    Session: string | null;
    authenticationFlowType: 'USER_SRP_AUTH';
    client: Record<string, any>;
    pool: Record<string, any>;
    signInUserSession: Record<string, any> | null;

    storage: Record<string, any>;
    userDataKey: string;
    username: string;
  };
  userConfirmed: boolean;
  userSub: string;
}
