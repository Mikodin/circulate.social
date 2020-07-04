describe('cognitoDynamoUserSyncTrigger', async () => {
  describe('Happy path', () => {
    it('Should call "UserModel.save" with the User data coming from Event', () => {});
    it('Should return the passed in event', async () => {});
  });
  describe('Unappy path', () => {
    describe('When "UserModel.save" throws an error', () => {
      it('Should call "log.error"', () => {});
      it('Should return the passed in event', () => {});
    });
  });
});
