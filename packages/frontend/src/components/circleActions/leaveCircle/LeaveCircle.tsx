import { useState } from 'react';
import Axios from 'axios';
import { Button } from 'antd';
import { ExportOutlined, LoadingOutlined } from '@ant-design/icons';
import { useRouter } from 'next/router';

import { Circle } from '@circulate/types';

import { API_ENDPOINT } from '../../../util/constants';

export interface Props {
  circle: Circle;
  jwtToken: string;
}

const LeaveCircle = ({ circle, jwtToken }: Props): JSX.Element => {
  const LEAVE_CIRCLE_ENDPOINT = `${API_ENDPOINT}/circles/${circle.id}/leave`;

  const router = useRouter();
  const [isLeaveCircleInFlight, setIsLeaveCircleInFlight] = useState(false);

  const fetchLeaveCircle = async () => {
    setIsLeaveCircleInFlight(true);
    const leftCircle = await Axios.post(
      LEAVE_CIRCLE_ENDPOINT,
      {},
      {
        headers: { Authorization: jwtToken },
      }
    );

    if (leftCircle.data.left.success) {
      if (router.route === '/circles/home') {
        router.reload();
      } else {
        router.push('/circles/home');
      }
    }
  };
  return (
    <Button
      size="middle"
      type="default"
      icon={isLeaveCircleInFlight ? <LoadingOutlined /> : <ExportOutlined />}
      disabled={isLeaveCircleInFlight}
      onClick={fetchLeaveCircle}
    >
      {circle.members.length > 1 ? 'Leave Circle' : 'Delete Circle'}
    </Button>
  );
};

export default LeaveCircle;
