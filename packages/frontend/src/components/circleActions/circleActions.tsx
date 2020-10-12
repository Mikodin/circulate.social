import { Circle } from '@circulate/types';
import { Button } from 'antd';
import Link from 'next/link';
import { FileAddOutlined, SettingOutlined } from '@ant-design/icons';

import CopyCircleInviteToClipboard from '../copyCircleInviteToClipboard/CopyCircleInviteToClipboard';
import styles from './circleActions.module.scss';

export interface Props {
  circle: Circle;
}

export const CircleActions = ({ circle }: Props): JSX.Element => (
  <div className={styles.circleActions}>
    <CopyCircleInviteToClipboard circleId={circle.id} />

    <Link href={`/submit-content?circleId=${circle.id}`}>
      <Button size="middle" type="default" icon={<FileAddOutlined />}>
        Submit a post
      </Button>
    </Link>

    {/* TODO - have it link to /settings */}
    <Link href={`${circle.id}`}>
      <Button size="middle" type="default" icon={<SettingOutlined />} disabled>
        Settings
      </Button>
    </Link>
  </div>
);
