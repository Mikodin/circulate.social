import { Button } from 'antd';
import Link from 'next/link';

import { Circle } from '@circulate/types';
import styles from './circlePreview.module.scss';
import CircleActionsContainer from '../circleActions/CircleActionsContainer';

export interface Props {
  circle: Circle;
  isUserInCircle: boolean;
  jwtToken: string;
}

const CirclePreview = (props: Props): React.ReactElement => {
  const { isUserInCircle, jwtToken, circle } = props;

  return (
    <div key={circle.id} className={styles.container}>
      <h2>
        {isUserInCircle ? (
          <Link href="[circleId]" as={`${circle.id}`}>
            <a>{circle.name}</a>
          </Link>
        ) : (
          <Link href="[circleId]/join" as={`${circle.id}/join`}>
            <a>{circle.name}</a>
          </Link>
        )}
      </h2>
      <div className={styles.infoContainer}>
        {circle.description && <h5>{circle.description.slice(0, 120)}...</h5>}
        <small>
          <p>
            Posts: {(circle.content || []).length} | Sends: {circle.frequency}
          </p>
        </small>
        <small>
          <p>Members: {circle.members.length}</p>
        </small>

        {isUserInCircle ? (
          <CircleActionsContainer circle={circle} jwtToken={jwtToken} />
        ) : (
          <>
            <h3>You are not a member of this Circle.</h3>
            <Button type="primary">
              <Link href="[circleId]/join" as={`${circle.id}/join`}>
                <a>Would you like to join?</a>
              </Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default CirclePreview;
