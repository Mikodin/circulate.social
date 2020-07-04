import log from 'lambda-log';
import { handler } from './cognitoDynamoUserSyncTrigger';
import * as mockEvent from './mockPostCognitoAuthenticationEvent.json';
import UserModel from '../../interfaces/dynamo/userModel';

const mockUser = {
  id: '51356193-19e0-46eb-b566-1c3410e15b2c',
  email: 'mike@circulate.social',
  firstName: 'Michael',
  lastName: 'A',
  createdAt: '2020-07-04T20:20:23.513Z',
  updatedAt: '2020-07-04T20:20:23.513Z',
};
jest.mock('../../interfaces/dynamo/userModel', () => ({
  create: jest.fn(() => mockUser),
}));

describe('cognitoDynamoUserSyncTrigger', async () => {
  describe('Happy path', () => {
    it('Should call "UserModel.save" with the User data coming from Event', async () => {
      const userModelSaveSpy = jest.spyOn(UserModel, 'create');
      // @ts-expect-error
      await handler(mockEvent);

      expect(userModelSaveSpy).toHaveBeenCalledWith(
        {
          email: 'mike@circulate.social',
          firstName: 'Michael',
          id: '51356193-19e0-46eb-b566-1c3410e15b2c',
          lastName: 'A',
        },
        { overwrite: true }
      );
    });
    it('Should return the passed in event ', async () => {
      // @ts-expect-error
      const resp = await handler(mockEvent);
      expect(resp).toEqual(mockEvent);
    });

    describe('Unappy path', () => {
      describe('When "UserModel.save" throws an error', () => {
        const userModelCreateSpy = jest.spyOn(UserModel, 'create');
        beforeEach(() => {
          userModelCreateSpy.mockClear();
          userModelCreateSpy.mockImplementationOnce(() => Promise.reject());
        });
        it('Should call "log.error"', async () => {
          const logErrorSpy = jest.spyOn(log, 'error');
          // @ts-expect-error
          await handler(mockEvent);
          expect(logErrorSpy).toHaveBeenCalled();
        });
        it('Should return the passed in event', async () => {
          // @ts-expect-error
          const resp = await handler(mockEvent);
          expect(resp).toEqual(mockEvent);
        });
      });
    });
  });
});
