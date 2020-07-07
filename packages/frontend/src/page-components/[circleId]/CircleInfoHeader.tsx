import { Circle } from '@circulate/types';
import { Button, Skeleton } from 'antd';
import { FileAddOutlined, SettingOutlined } from '@ant-design/icons';

import Link from 'next/link';

import CopyCircleInviteToClipboard from './CopyCircleInviteToClipboard';
import styles from './circleInfoHeader.module.scss';

export interface Props {
  circle: Circle;
  isLoading: boolean;
}

const CircleInfoHeader = (props: Props): JSX.Element => {
  const { circle, isLoading } = props;
  return isLoading || !circle ? (
    <div data-testid="skeleton">
      <Skeleton active={isLoading} />
    </div>
  ) : (
    <div className={styles.infoHeader}>
      <h2>{circle.name}</h2>
      <h4>Posts: {(circle.content || []).length}</h4>
      <h4>Members: {circle.members.length}</h4>
      <h4>Sends: {circle.frequency}</h4>
      {circle.description && <p>{circle.description}</p>}
      <div className={styles.circleActions}>
        <CopyCircleInviteToClipboard circleId={circle.id} />

        <Link href={`/submit-content?circleId=${circle.id}`}>
          <Button size="middle" type="default" icon={<FileAddOutlined />}>
            Submit a post
          </Button>
        </Link>

        {/* TODO - have it link to /settings */}
        <Link href={`${circle.id}`}>
          <Button size="middle" type="default" icon={<SettingOutlined />}>
            Settings
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default CircleInfoHeader;
