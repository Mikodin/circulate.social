import * as dynamoose from 'dynamoose';

export const ContentSchema = new dynamoose.Schema(
  {
    id: {
      type: String,
      hashKey: true,
      required: true,
    },
    createdBy: { type: String, required: true },
    title: {
      type: String,
      required: true,
    },
    circleIds: {
      required: true,
      type: Array,
      schema: [String],
      default: [],
    },
    dateTime: String,
    description: String,
    link: String,
    privacy: {
      type: String,
      enum: ['private', 'public'],
      default: 'private',
    },
    categories: {
      type: Set,
      schema: [String],
    },
    tags: {
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

const ContentModel = dynamoose.model(
  process.env.CONTENT_TABLE_NAME || 'content-dev',
  ContentSchema,
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

export default ContentModel;
