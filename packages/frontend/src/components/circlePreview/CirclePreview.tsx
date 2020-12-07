import { useState } from 'react';
import { useRouter } from 'next/router';
import { Button, Divider } from 'antd';
import Link from 'next/link';

import { Circle } from '@circulate/types';
import styles from './circlePreview.module.scss';
import CircleActionsContainer from '../circleActions/CircleActionsContainer';
import { fetchJoinCircle } from '../../pages/circles/[circleId]/join';

export interface Props {
  circle: Circle;
  isUserInCircle: boolean;
  jwtToken: string;
}

const CirclePreview = (props: Props): React.ReactElement => {
  const { isUserInCircle, jwtToken, circle } = props;
  const [isJoinCircleInFlight, setIsJoinCircleInFlight] = useState(false);
  const router = useRouter();

  const handleFetchJoinCircle = async () => {
    setIsJoinCircleInFlight(true);
    try {
      await fetchJoinCircle(circle.id, jwtToken);
      router.push({
        pathname: `/circles/${circle.id}`,
        query: { isWelcomingUser: true },
      });
    } catch (error) {
      console.error(error);
      setIsJoinCircleInFlight(false);
    }
  };

  return (
    <div key={circle.id} className={styles.container}>
      <h2>
        {isUserInCircle ? (
          <Link href="[circleId]" as={`${circle.id}`}>
            <a>{circle.name}</a>
          </Link>
        ) : (
          <Link
            href="[circleId]/join?fromDiscover=true"
            as={`${circle.id}/join?fromDiscover=true`}
          >
            <a>{circle.name}</a>
          </Link>
        )}
      </h2>
      <div className={styles.infoContainer}>
        {circle.description && (
          <h5>
            {circle.description.length > 120
              ? `${circle.description.slice(0, 120)}...`
              : circle.description}
          </h5>
        )}
        <small>
          <p>
            Posts: {(circle.content || []).length} | {circle.frequency}
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
            <Button
              type="primary"
              onClick={() => handleFetchJoinCircle()}
              loading={isJoinCircleInFlight}
            >
              <a>Join</a>
            </Button>
            <Divider type="vertical" />
            <Button type="default">
              <Link
                href="[circleId]/join?fromDiscover=true"
                as={`${circle.id}/join?fromDiscover=true`}
              >
                <a>Learn more</a>
              </Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default CirclePreview;
