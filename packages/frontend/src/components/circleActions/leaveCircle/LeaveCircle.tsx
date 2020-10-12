import { Button } from 'antd';
import { ExportOutlined } from '@ant-design/icons';
import Link from 'next/link';

export interface Props {
  circleId: string;
}

const LeaveCircle = ({ circleId }: Props): JSX.Element => (
  <Link href={`${circleId}`}>
    <Button size="middle" type="default" icon={<ExportOutlined />} disabled>
      Leave Circle
    </Button>
  </Link>
);

export default LeaveCircle;
