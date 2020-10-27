import { Circle } from '@circulate/types';
import { Skeleton } from 'antd';

import CircleActionsContainer from '../../components/circleActions/CircleActionsContainer';
import CircleMembers from '../../components/circleMembers/CircleMembers';
import styles from './circleInfoHeader.module.scss';

export interface Props {
  circle: Circle;
  isLoading: boolean;
  jwtToken: string;
}

const CircleInfoHeader = (props: Props): JSX.Element => {
  const { circle, isLoading, jwtToken } = props;
  return isLoading || !circle ? (
    <div data-testid="skeleton">
      <Skeleton active={isLoading} />
    </div>
  ) : (
    <div className={styles.infoHeader}>
      <h2>{circle.name}</h2>
      <h4>Posts: {(circle.content || []).length}</h4>
      <CircleMembers
        circleMemberNames={circle.members}
        renderComponent={
          <h4>
            <a>Members: {circle.members.length}</a>
          </h4>
        }
      />
      <h4>Sends: {circle.frequency}</h4>
      {circle.description && <p>{circle.description}</p>}
      <CircleActionsContainer circle={circle} jwtToken={jwtToken} />
    </div>
  );
};

export default CircleInfoHeader;
