import { useState } from 'react';
import { Circle } from '@circulate/types';
import { Button, Popover, Divider } from 'antd';

import Link from 'next/link';
import {
  FileAddOutlined,
  SettingOutlined,
  EllipsisOutlined,
} from '@ant-design/icons';

import LeaveCircle from './leaveCircle/LeaveCircle';
import CopyCircleInviteToClipboard from './copyCircleInviteToClipboard/CopyCircleInviteToClipboard';
import styles from './circleActionsContainer.module.scss';

export interface Props {
  circle: Circle;
  jwtToken: string;
}

const CircleActions = ({ circle, jwtToken }: Props): JSX.Element => {
  const [isPopoverVisible, setIsPopoverVisible] = useState(false);
  return (
    <div className={styles.circleActionsContainer}>
      <Link href={`/submit-content?circleId=${circle.id}`}>
        <Button size="middle" type="primary" icon={<FileAddOutlined />}>
          Submit a post
        </Button>
      </Link>

      <CopyCircleInviteToClipboard
        circleId={circle.id}
        circleName={circle.name}
      />

      <Popover
        visible={isPopoverVisible}
        onVisibleChange={(isPopoverOpen) => setIsPopoverVisible(isPopoverOpen)}
        trigger="click"
        placement="bottom"
        content={
          <div>
            <LeaveCircle
              onModalOpen={() => setIsPopoverVisible(false)}
              circle={circle}
              jwtToken={jwtToken}
            />
            <Divider type="vertical" />
            <Link href="[circleId]" as={`${circle.id}`}>
              <Button
                size="middle"
                type="default"
                icon={<SettingOutlined />}
                disabled
              >
                Settings
              </Button>
            </Link>
          </div>
        }
      >
        <Button icon={<EllipsisOutlined />} />
      </Popover>
    </div>
  );
};

export default CircleActions;
