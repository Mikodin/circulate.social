import {
  CognitoUserPoolTriggerEvent,
  CognitoUserPoolTriggerHandler,
} from 'aws-lambda';
import log from 'lambda-log';
import { User } from '@circulate/types/index';
import UserModel from '../../interfaces/dynamo/userModel';

export const handler: CognitoUserPoolTriggerHandler = async (
  event: CognitoUserPoolTriggerEvent
) => {
  log.info(event);
  const { request } = event;
  const { userAttributes } = request;
  const user = {
    id: `${userAttributes.sub}`,
    email: userAttributes.email,
    firstName: userAttributes['custom:first_name'],
    lastName: userAttributes['custom:last_name'],
  };

  try {
    log.info('Attempting to create user', { user });

    // @ts-expect-error
    const savedUser = (await UserModel.create(user, {
      overwrite: true,
    })) as User;

    log.info('Upserted user', user);

    return { ...event, user: savedUser };
  } catch (error) {
    // Don't throw error.  We don't want to block a user from signing in because of this
    log.error('Failed to save user', error);
  }

  return event;
};
