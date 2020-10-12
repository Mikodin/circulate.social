import { Circle } from '@circulate/types';
import { Skeleton } from 'antd';

import { CircleActions } from '../../components/circleActions/circleActions';
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
      <CircleActions circle={circle} />
    </div>
  );
};

export default CircleInfoHeader;
