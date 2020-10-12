import { Circle } from '@circulate/types';
import { Button } from 'antd';
import Link from 'next/link';
import { FileAddOutlined, SettingOutlined } from '@ant-design/icons';

import LeaveCircle from './leaveCircle/LeaveCircle';
import CopyCircleInviteToClipboard from './copyCircleInviteToClipboard/CopyCircleInviteToClipboard';
import styles from './circleActionsContainer.module.scss';

export interface Props {
  circle: Circle;
  jwtToken: string;
}

const CircleActions = ({ circle, jwtToken }: Props): JSX.Element => (
  <div className={styles.circleActions}>
    <Link href={`/submit-content?circleId=${circle.id}`}>
      <Button size="middle" type="primary" icon={<FileAddOutlined />}>
        Submit a post
      </Button>
    </Link>

    <CopyCircleInviteToClipboard circleId={circle.id} />
    <LeaveCircle circle={circle} jwtToken={jwtToken} />

    <Link href={`${circle.id}`}>
      <Button size="middle" type="default" icon={<SettingOutlined />} disabled>
        Settings
      </Button>
    </Link>
  </div>
);

export default CircleActions;
