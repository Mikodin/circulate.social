import * as dynamoose from 'dynamoose';

const CircleSchema = new dynamoose.Schema(
  {
    id: {
      type: String,
      hashKey: true,
      required: true,
    },
    createdBy: { type: String, required: true },
    name: {
      type: String,
      required: true,
    },
    description: String,
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'biweekly', 'monthly'],
    },
    members: {
      // @ts-expect-error
      type: Set,
      // @ts-expect-error
      schema: [String],
    },
    creatorId: String,
    events: {
      type: Array,
      // @ts-expect-error
      schema: [String],
    },
    content: {
      type: Array,
      // @ts-expect-error
      schema: [String],
      default: [],
    },
    privacy: {
      type: String,
      enum: ['private', 'public'],
      default: 'private',
    },
  },
  {
    timestamps: {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt', // updatedAt will not be stored as part of the timestamp
    },
  }
);

const CircleModel = dynamoose.model(
  process.env.CIRCLES_TABLE_NAME || 'circles-dev',
  CircleSchema,
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

export default CircleModel;