import { APIGatewayProxyHandler } from 'aws-lambda';
import log from 'lambda-log';
import { Content } from '@circulate/types';
import ContentModel from '../../interfaces/dynamo/contentModel';
import { generateReturn, getMemberFromAuthorizer } from '../endpointUtils';

export const handler: APIGatewayProxyHandler = async (event) => {
  const { memberId, isEmailVerified } = getMemberFromAuthorizer(event);
  const { contentId } = event.pathParameters;

  if (!isEmailVerified) {
    return generateReturn(401, {
      message: 'Please verify your email address',
    });
  }

  try {
    const contentToDeleteModel = await ContentModel.get(contentId);
    if (!contentToDeleteModel) {
      return generateReturn(404, {
        message: `Content with id:[${contentId}] was not found`,
        deleted: { success: false, contentId, deleted: false },
      });
    }

    const contentToDelete = JSON.parse(
      JSON.stringify(contentToDeleteModel.original())
    ) as Content;

    const didUserCreateContent = contentToDelete.createdBy === memberId;

    if (!didUserCreateContent) {
      return generateReturn(401, {
        message: `You do not have permission to delete this content as you are not the creator`,
        deleted: { success: false, contentId, deleted: false },
      });
    }

    await ContentModel.delete(contentId);

    return generateReturn(200, {
      message: 'Successfully deleted the Content',
      deleted: { success: true, contentId, deleted: true },
    });
  } catch (error) {
    log.error('Failed to delete content', {
      error,
    });
    return generateReturn(500, {
      message: 'Something went wrong trying to delete the content',
    });
  }
};
