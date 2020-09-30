import * as dynamoose from 'dynamoose';

const CirculationSchema = new dynamoose.Schema(
  {
    // <userId>:<frequency>
    urn: {
      type: String,
      hashKey: true,
      required: true,
    },
    circulationId: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    frequency: {
      type: String,
      required: true,
    },
    circles: {
      // @ts-ignore
      type: Set,
      schema: [String],
    },
  },
  {
    timestamps: {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt', // updatedAt will not be stored as part of the timestamp
    },
  }
);

const CirculationModel = dynamoose.model(
  process.env.UPCOMING_CIRCULATION_TABLE_NAME || 'upcomingCirculation-dev',
  CirculationSchema,
  {
    create: false,
    waitForActive: {
      enabled: false,
      check: {
        timeout: 180000,
        frequency: 1000,
      },
    },
  }
);

export default CirculationModel;
