import { useState } from 'react';
import * as copy from 'copy-to-clipboard';
import { Input, Button } from 'antd';
import { CopyOutlined, CheckCircleOutlined } from '@ant-design/icons';

export interface Props {
  circleId: string;
}
const domain = 'beta.circulate.social';

const CopyCircleInviteToClipboard = (props: Props): JSX.Element => {
  const { circleId } = props;
  const [isTextCopied, setIsTextCopied] = useState(false);
  return (
    <Input
      size="small"
      addonBefore={
        <Button
          size="small"
          onClick={() => {
            copy.default(`https://${domain}/circles/${circleId}?join=true`);
            setIsTextCopied(true);

            setTimeout(() => {
              setIsTextCopied(false);
            }, 2000);
          }}
          type={isTextCopied ? 'primary' : 'default'}
          icon={isTextCopied ? <CheckCircleOutlined /> : <CopyOutlined />}
          block
        >
          {isTextCopied ? 'Copied!' : 'Invite'}
        </Button>
      }
      readOnly
      value={`https://${domain}/circles/${circleId}?join=true`}
    />
  );
};

export default CopyCircleInviteToClipboard;
