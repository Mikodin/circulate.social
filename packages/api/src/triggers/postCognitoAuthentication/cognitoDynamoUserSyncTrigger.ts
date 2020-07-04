import {
  CognitoUserPoolTriggerEvent,
  CognitoUserPoolTriggerHandler,
} from 'aws-lambda';
import log from 'lambda-log';
import UserModel from '../../interfaces/dynamo/userModel';

export const handler: CognitoUserPoolTriggerHandler = async (
  event: CognitoUserPoolTriggerEvent
) => {
  log.info(event);
  const { request } = event;
  const { userAttributes } = request;
  const user = new UserModel({
    id: userAttributes.sub,
    email: userAttributes.email,
    firstName: userAttributes['custom:first_name'],
    lastName: userAttributes['custom:last_name'],
  });

  try {
    log.info('Attempting to create user', { user });
    const savedUser = await user.save();
    log.info('Upserted user', user);

    return { ...event, user: savedUser };
  } catch (error) {
    log.error('Failed to save user', error);
  }
  return event;
};
