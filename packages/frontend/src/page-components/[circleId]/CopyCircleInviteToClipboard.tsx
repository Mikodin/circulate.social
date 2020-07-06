import { useState } from 'react';
import * as copy from 'copy-to-clipboard';
import { Input, Button, Modal } from 'antd';
import {
  CheckCircleOutlined,
  UserAddOutlined,
  CopyOutlined,
} from '@ant-design/icons';

import styles from './copyCircleInviteToClipboard.module.scss';

export interface Props {
  circleId: string;
}
const domain = 'beta.circulate.social';

const CopyCircleInviteToClipboard = (props: Props): JSX.Element => {
  const { circleId } = props;
  const baseInviteText = `Hey, you should come join our Circle!\n\nhttps://${domain}/circles/${circleId}?join=true`;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTextCopied, setIsTextCopied] = useState(false);
  const [inviteText, setInviteText] = useState(baseInviteText);

  const inviteButton = (
    <Button
      key="inviteButton"
      size="middle"
      onClick={() => {
        copy.default(inviteText);
        setIsTextCopied(true);

        setTimeout(() => {
          setIsTextCopied(false);
          setIsModalOpen(false);
        }, 2000);
      }}
      type={isTextCopied ? 'primary' : 'default'}
      icon={isTextCopied ? <CheckCircleOutlined /> : <CopyOutlined />}
    >
      {isTextCopied ? 'Copied!' : 'Copy To Clipboard'}
    </Button>
  );

  return (
    <div>
      <Button onClick={() => setIsModalOpen(true)} icon={<UserAddOutlined />}>
        Invite
      </Button>

      <Modal
        className={styles.modal}
        visible={isModalOpen}
        title="Invite someone"
        onOk={() => setIsModalOpen(false)}
        onCancel={() => {
          setIsModalOpen(false);
          setInviteText(baseInviteText);
        }}
        footer={[inviteButton]}
      >
        <Input.TextArea
          rows={4}
          value={inviteText}
          onChange={(event) => {
            setInviteText(event.target.value);
          }}
        />
      </Modal>
      {/* {inviteButton} */}
    </div>
  );
};

export default CopyCircleInviteToClipboard;
