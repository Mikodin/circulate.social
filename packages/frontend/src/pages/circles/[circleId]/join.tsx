import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { Button, Divider } from 'antd';
import { CirclePreview } from '@circulate/types';

import UserContext from '../../../state-management/UserContext';
import AuthContainer from '../../../components/authorization/AuthContainer';
import Layout from '../../../components/layout/Layout';
import CircleInfoHeader from '../../../page-components/[circleId]/CircleInfoHeader';
import { API_ENDPOINT } from '../../../util/constants';

const GET_CIRCLE_BY_ID_ENDPOINT = `${API_ENDPOINT}/circles`;

const fetchCirclePreview = async (circleId: string) => {
  const circlePreviewResp = await axios.get(
    `${GET_CIRCLE_BY_ID_ENDPOINT}/${circleId}/preview`
  );
  return circlePreviewResp.data.circlePreview as CirclePreview;
};

const fetchJoinCircle = async (
  circleId: string,
  jwtToken: string
): Promise<boolean> => {
  const joinResponse = await axios.post(
    `${GET_CIRCLE_BY_ID_ENDPOINT}/${circleId}/join`,
    null,
    {
      headers: { Authorization: jwtToken },
    }
  );
  const { joined } = joinResponse.data;

  return Boolean(joined);
};

export const joinCircle = (): JSX.Element => {
  const { getIsUserLoggedIn, jwtToken } = useContext(UserContext);
  const router = useRouter();
  const [isGetCirclePreviewInFlight, setIsGetCirclePreviewInFlight] = useState(
    false
  );
  const [isJoinCircleInFlight, setIsJoinCircleInFlight] = useState(false);

  const [circleId, setCircleId] = useState<string | undefined>(undefined);
  const [circlePreview, setCirclePreview] = useState<CirclePreview | undefined>(
    undefined
  );

  const handleFetchCirclePreview = async () => {
    setIsGetCirclePreviewInFlight(true);
    try {
      setCirclePreview(await fetchCirclePreview(circleId));
      setIsGetCirclePreviewInFlight(false);
    } catch (error) {
      console.error(error);
      setIsGetCirclePreviewInFlight(false);
    }
  };

  const handleFetchJoinCircle = async () => {
    setIsJoinCircleInFlight(true);
    try {
      await fetchJoinCircle(circleId, jwtToken);
      router.push({
        pathname: '/circles/[circleId]',
        query: { circleId },
      });
    } catch (error) {
      console.error(error);
      setIsJoinCircleInFlight(false);
    }
  };

  useEffect(() => {
    const { circleId: circleIdFromRoute } = router.query;
    if (circleIdFromRoute) {
      setCircleId(`${circleIdFromRoute}`);
    }
  }, [router]);

  useEffect(() => {
    if (circleId) {
      handleFetchCirclePreview();
    }
  }, [circleId]);

  const isUserLoggedIn = getIsUserLoggedIn();
  return (
    <Layout>
      <div>
        <h1>🎉 Welcome to to the party!</h1>
        <h2>This is a collaborative newsletter platform.</h2>
        <h3>
          Designed to empower communities of all sizes to quickly collect and
          share curated content.
        </h3>
        <h3>All delivered as one relevant email digest.</h3>
        <Divider />

        <h2>Congrats - You&lsquo;ve been invited to join a Circle!</h2>
        <CircleInfoHeader
          circlePreview={circlePreview}
          isLoading={isGetCirclePreviewInFlight}
          jwtToken={''}
        />
        {isUserLoggedIn ? (
          <Button
            loading={isJoinCircleInFlight}
            type="primary"
            onClick={handleFetchJoinCircle}
            disabled={!circlePreview}
            size="large"
          >
            Join Circle
          </Button>
        ) : (
          <AuthContainer />
        )}
      </div>
    </Layout>
  );
};

export default joinCircle;
