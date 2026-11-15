import React, { useId } from 'react';
import Button from '~/components/Button';
import Input from '~/components/Texts/Input';
import {
  chatTopicButtonStyle,
  chatTopicSectionClass
} from '~/containers/Chat/Modals/topicStyles';
import { AI_IMAGE_COLLECTION_NAME_MAX } from '~/helpers/aiImageHistory';

// "Start a Topic" from the Zero/Ciel Topics window (TopicInput + Start this
// Topic), for a collection: a name and a Start button.
export default function StartCollectionForm({
  label,
  value,
  onChange,
  starting,
  error,
  themeColor = 'logoBlue',
  onStart
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  starting: boolean;
  error: string;
  themeColor?: string;
  onStart: () => void;
}) {
  const inputId = useId();
  const tooLong = value.length > AI_IMAGE_COLLECTION_NAME_MAX;
  return (
    <div style={{ width: '100%' }}>
      <label
        htmlFor={inputId}
        className={chatTopicSectionClass}
        style={{ display: 'block', marginTop: 0, marginBottom: 8 }}
      >
        {label}
      </label>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Input
            id={inputId}
            aria-describedby={`${inputId}-count`}
            aria-invalid={tooLong}
            placeholder="My comic's characters"
            value={value}
            onChange={onChange}
            hasError={tooLong}
            style={{ minHeight: 44, fontSize: 'calc(16 * var(--px))' }}
          />
          <small
            id={`${inputId}-count`}
            style={{
              display: 'block',
              marginTop: 6,
              textAlign: 'right',
              fontSize: 'calc(12 * var(--px))',
              color: tooLong ? '#b42318' : '#526176'
            }}
          >
            {value.length}/{AI_IMAGE_COLLECTION_NAME_MAX} Characters
          </small>
        </div>
        <Button
          color={themeColor}
          style={{ ...chatTopicButtonStyle(themeColor), minHeight: 44 }}
          uppercase={false}
          disabled={!value.trim() || tooLong || starting}
          loading={starting}
          onClick={onStart}
        >
          Start
        </Button>
      </div>
      {error && (
        <p
          role="alert"
          style={{
            margin: '6px 0 0',
            fontSize: 'calc(14 * var(--px))',
            color: '#b42318'
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
