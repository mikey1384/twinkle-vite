import React, { useEffect, useState } from 'react';
import Loading from '~/components/Loading';
import InvalidPage from '~/components/InvalidPage';
import request from 'axios';
import URL from '~/constants/URL';
import { useNavigate, useParams } from 'react-router-dom';

export default function Redirect() {
  const navigate = useNavigate();
  const { username } = useParams();
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    init();

    async function init() {
      const { data: userExists } = await request.get(
        `${URL}/user/check?username=${username}`
      );
      if (userExists) return navigate(`/users/${username}`);
      setLoaded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div>{loaded ? <InvalidPage /> : <Loading text="Loading..." />}</div>;
}
