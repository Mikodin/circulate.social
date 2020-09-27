describe('circulationSender', () => {
  describe('Direct path', () => {
    describe('Fetch upcoming Circulations', () => {
      test.todo('Should call UpcomingCirculationModel.scan(');
      test.todo('Should return early when there are no upcoming circulations');
    });

    describe('Structuring the data', () => {
      describe('Handling multiple frequencies for a single user', () => {
        describe('One Circulation should be created for a single user', () => {
          test.todo('Should call createOneCirculationPerUser');
        });
      });

      describe('Fetching the individual components of a circulation', () => {
        test.todo('Should call constructCirculationComponentMaps');
      });

      describe('Matching individual components with a single Circulation', () => {
        test.todo('Should call constructFilledOutCirculations');
      });
    });

    describe('Sending the Circulation email', () => {
      describe('Creating the HTML for the email', () => {
        test.todo('Should call createCirculationHtmlForUser');
      });

      describe('It should send a Circulation email for each user', () => {
        test.todo('Should call mailgun.messages().send(emailParams) X times');
      });
    });
  });
  describe('Path of recovery', () => {
    test.todo('should call log.error');
  });
});
