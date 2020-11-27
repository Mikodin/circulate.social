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

export const fetchJoinCircle = async (
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
  const { getIsUserLoggedIn, jwtToken, user } = useContext(UserContext);
  const router = useRouter();

  const [isGetCirclePreviewInFlight, setIsGetCirclePreviewInFlight] = useState(
    false
  );
  const [isJoinCircleInFlight, setIsJoinCircleInFlight] = useState(false);
  const [circleId, setCircleId] = useState<string | undefined>(undefined);
  const [fromDiscover, setFromDiscover] = useState(false);
  const [circlePreview, setCirclePreview] = useState<CirclePreview | undefined>(
    undefined
  );
  // const [isLearnMoreExpanded, setIsLearnMoreExpanded] = useState(false);

  const routeToCircle = () =>
    router.push({
      pathname: `/circles/${circleId}`,
      query: { welcome: true },
    });

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
      routeToCircle();
    } catch (error) {
      console.error(error);
      setIsJoinCircleInFlight(false);
    }
  };

  useEffect(() => {
    const {
      circleId: circleIdFromRoute,
      fromDiscover: fromDiscoverQuery,
    } = router.query;
    if (circleIdFromRoute) {
      setCircleId(`${circleIdFromRoute}`);
      setFromDiscover(Boolean(fromDiscoverQuery));
    }
  }, [router]);

  useEffect(() => {
    if (circleId) {
      handleFetchCirclePreview();
    }
  }, [circleId]);

  useEffect(() => {
    if (user && circlePreview && circlePreview.memberIds.includes(user.id)) {
      routeToCircle();
    }
  }, [circlePreview, user]);

  const isUserLoggedIn = getIsUserLoggedIn();
  const welcomeText = fromDiscover ? (
    <>
      <h1>💎 Ah, welcome.</h1>
      <h2>It appears that you have discovered a gem.</h2>
      <p>
        If you made it this far, this Circle is likely for you!
        <br />
        <small>(And would likely benefit from your energy.)</small>
      </p>
      <p>Join in and find out!</p>
    </>
  ) : (
    <>
      <h1>🎉 Come, join the party!</h1>
      <h2>This is a collaborative newsletter platform.</h2>
      <h3>
        Designed to empower communities of all sizes to quickly collect and
        share curated content.
      </h3>
      <h3>All delivered as one relevant email digest.</h3>
      <Divider />

      <h2>Congrats - You&lsquo;ve been invited to join a Circle!</h2>
    </>
  );
  return (
    <Layout>
      {welcomeText}
      <div>
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
          <>
            <Divider />
            <h2>Come, get in Circulation!</h2>
            <AuthContainer />
          </>
        )}
      </div>
    </Layout>
  );
};

export default joinCircle;
