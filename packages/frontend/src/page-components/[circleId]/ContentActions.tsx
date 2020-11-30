// import { useState } from 'react';
import axios from 'axios';
import { Content } from '@circulate/types';
import { Button } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';

import { API_ENDPOINT } from '../../util/constants';
// import styles from './contentActions.module.scss';

async function deleteContent(
  contentId: string,
  jwtToken: string
): Promise<boolean> {
  try {
    const resp = await axios.delete(`${API_ENDPOINT}/content/${contentId}`, {
      headers: { Authorization: jwtToken },
    });
    if (resp.data.deleted.success) {
      return true;
    }

    return false;
  } catch (error) {
    console.error(error);
    return false;
  }
}

interface Props {
  jwtToken: string;
  content: Content;
  className?: string;
  onDeletionCompletion: (contentId) => void;
}

const ContentActions = ({
  content,
  jwtToken,
  onDeletionCompletion,
  className,
}: Props): JSX.Element => {
  const handleDeleteContent = async () => {
    await deleteContent(content.id, jwtToken);
    onDeletionCompletion(content.id);
  };

  return (
    <Button
      className={className}
      onClick={handleDeleteContent}
      icon={<DeleteOutlined />}
      size="small"
    >
      Delete
    </Button>
  );
};

export default ContentActions;
