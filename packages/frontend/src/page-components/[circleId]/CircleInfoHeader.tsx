import { Circle, CirclePreview } from '@circulate/types';
import { Skeleton } from 'antd';

import CircleActionsContainer from '../../components/circleActions/CircleActionsContainer';
import CircleMembers from '../../components/circleMembers/CircleMembers';
import styles from './circleInfoHeader.module.scss';

export interface Props {
  circle?: Circle;
  circlePreview?: CirclePreview;
  isLoading: boolean;
  jwtToken: string;
}

const CircleInfoHeader = (props: Props): JSX.Element => {
  const { circle, circlePreview, isLoading, jwtToken } = props;
  const { name, description, frequency } = circle || circlePreview || {};

  let totalContentCount;
  let circleMemberNames;
  if (circle || circlePreview) {
    circleMemberNames = circle ? circle.members : circlePreview.memberNames;
    totalContentCount = circle
      ? (circle.content || []).length
      : circlePreview.totalContentCount;
  }

  return isLoading || (!circle && !circlePreview) ? (
    <div data-testid="skeleton">
      <Skeleton active={isLoading} />
    </div>
  ) : (
    <div className={styles.infoHeader}>
      <h2>{name}</h2>
      <h4>Posts: {totalContentCount}</h4>
      <CircleMembers
        circleMemberNames={circleMemberNames}
        renderComponent={
          <h4>
            <a>Members: {circleMemberNames.length}</a>
          </h4>
        }
      />
      <h4>{frequency}</h4>
      {description && <p>{description}</p>}
      {circle && <CircleActionsContainer circle={circle} jwtToken={jwtToken} />}
    </div>
  );
};

export default CircleInfoHeader;
