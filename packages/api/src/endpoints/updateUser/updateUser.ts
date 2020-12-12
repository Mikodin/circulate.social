import { APIGatewayProxyHandler } from 'aws-lambda';
import log from 'lambda-log';
import AWS from 'aws-sdk';
import { User } from '@circulate/types';

import UserModel from '../../interfaces/dynamo/userModel';
import { generateReturn, getMemberFromAuthorizer } from '../endpointUtils';

const cognito = new AWS.CognitoIdentityServiceProvider();

export const handler: APIGatewayProxyHandler = async (event) => {
  log.info('Incoming request', event);
  const { isEmailVerified, memberId } = getMemberFromAuthorizer(event);

  const { firstName, lastName, timezone } = JSON.parse(event.body);

  if (!isEmailVerified) {
    return generateReturn(401, {
      message: 'Please verify your email address.',
    });
  }

  if (!firstName && !lastName && !timezone) {
    return generateReturn(400, {
      message:
        'The body is empty.  the fields we care about are {firstName: string, lastName: string, timezone: string}',
    });
  }

  try {
    const attributesToUpdate = [
      'custom:first_name',
      'custom:last_name',
      'custom:time_zone',
    ]
      .map((attribute) => {
        if (attribute === 'custom:first_name' && firstName) {
          return {
            Name: 'custom:first_name',
            Value: firstName,
          };
        }

        if (attribute === 'custom:last_name' && lastName) {
          return {
            Name: 'custom:last_name',
            Value: lastName,
          };
        }

        if (attribute === 'custom:time_zone' && timezone) {
          return {
            Name: 'custom:time_zone',
            Value: timezone,
          };
        }
        return undefined;
      })
      .filter((attribute) => Boolean(attribute));

    await cognito
      .adminUpdateUserAttributes({
        UserPoolId: 'us-east-1_80QcO55dx',
        Username: memberId,
        UserAttributes: attributesToUpdate,
      })
      .promise();

    const dbFieldsToUpdate = ['firstName', 'lastName', 'timezone'].reduce(
      (acc, current) => {
        if (current === 'firstName' && firstName) {
          acc[current] = firstName;
        }
        if (current === 'lastName' && lastName) {
          acc[current] = lastName;
        }
        if (current === 'timezone' && timezone) {
          acc[current] = timezone;
        }

        return acc;
      },
      {}
    );

    const updatedUser = JSON.parse(
      JSON.stringify(
        (
          await UserModel.update(
            { id: memberId },
            { $SET: { ...dbFieldsToUpdate } }
          )
        ).original()
      )
    ) as User;

    return generateReturn(200, {
      message: 'Successfully updated the User',
      user: updatedUser,
    });
  } catch (error) {
    log.error('Failed to update user', {
      error,
    });
    return generateReturn(500, {
      message: 'Something went wrong trying to update the user.',
    });
  }
};
