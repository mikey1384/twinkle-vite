import { useEffect, useState } from 'react';
import Loading from '~/components/Loading';
import PasswordForm from './PasswordForm';
import { useParams } from 'react-router-dom';
import { useAppContext } from '~/contexts';

export default function Content() {
  const { token } = useParams();
  const verifyEmail = useAppContext((v) => v.requestHelpers.verifyEmail);
  const [loaded, setLoaded] = useState(false);
  const [profilePicUrl, setProfilePicUrl] = useState(null);
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState('');
  const [expired, setExpired] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    init();
    async function init() {
      try {
        const { profilePicUrl, userId, username, errorMsg } = await verifyEmail(
          {
            token: token.replace(/\+/g, '.'),
            forPasswordReset: true
          }
        );
        setLoaded(true);
        setProfilePicUrl(profilePicUrl);
        setUserId(userId);
        setUsername(username);
        if (errorMsg) {
          setErrorMessage(errorMsg);
        }
      } catch (error) {
        setLoaded(true);
        setExpired(error.response?.status === 401);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        fontSize: '2.5rem',
        fontWeight: 'bold',
        display: 'flex',
        justifyContent: 'center',
        marginTop: '10rem'
      }}
    >
      {loaded ? (
        <div style={{ textAlign: 'center' }}>
          {userId && username ? (
            <PasswordForm
              profilePicUrl={profilePicUrl}
              userId={userId}
              username={username}
            />
          ) : expired ? (
            <div>
              The token is invalid or expired. Please request the verification
              email again
            </div>
          ) : errorMessage ? (
            <div>{errorMessage}</div>
          ) : (
            <div>There was an error</div>
          )}
        </div>
      ) : (
        <Loading />
      )}
    </div>
  );
}
