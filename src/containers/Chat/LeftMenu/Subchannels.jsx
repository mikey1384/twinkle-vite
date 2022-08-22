import ErrorBoundary from '~/components/ErrorBoundary';

export default function SubChannels() {
  return (
    <ErrorBoundary componentPath="Chat/LeftMenu/Subchannels">
      <div
        style={{
          border: '1px solid #e6e6e6',
          padding: '1rem',
          marginTop: '2rem',
          marginLeft: '1rem',
          marginRight: '1rem',
          marginBottom: '-1rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <div>menu1</div>
        <div>menu2</div>
        <div>menu3</div>
        <div>menu4</div>
      </div>
    </ErrorBoundary>
  );
}
