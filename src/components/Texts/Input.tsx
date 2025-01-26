import React, {
  RefObject,
  useMemo,
  useCallback,
  useEffect,
  useRef
} from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { renderText } from '~/helpers/stringHelpers';

const iosKeyboardAttributes = {
  autoCorrect: 'off',
  autoCapitalize: 'off',
  spellCheck: false,
  'data-detectors': 'off',
  'data-keyboard': 'none'
};

export default function Input({
  hasError,
  inputRef,
  onChange,
  errorMessage,
  type = 'text',
  className,
  isHighlighted,
  style,
  autoComplete,
  ...props
}: {
  hasError?: boolean;
  name?: string;
  inputRef?: RefObject<HTMLInputElement>;
  onChange: (value: string) => void;
  type?: 'text' | 'password' | 'email' | 'tel' | 'number';
  className?: string;
  isHighlighted?: boolean;
  errorMessage?: string;
  style?: React.CSSProperties;
  autoComplete?: string;
  [key: string]: any;
}) {
  const internalInputRef = useRef<HTMLInputElement>(null);
  const actualInputRef = inputRef || internalInputRef;

  const autoCompleteValue = useMemo(() => {
    if (autoComplete) return autoComplete;
    if (type === 'password') return 'current-password';
    if (type === 'email') return 'email';
    if (type === 'tel') return 'tel';
    return 'off';
  }, [autoComplete, type]);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange(renderText(event.target.value));
    },
    [onChange]
  );

  const inputClassName = useMemo(() => {
    const baseClass =
      className ||
      css`
        width: 100%;
      `;
    return `${baseClass} ${css`
      border: 1px solid ${Color.darkerBorderGray()};
      font-size: 1.7rem;
      &:focus {
        outline: none;
        ::placeholder {
          color: ${Color.lighterGray()};
        }
      }
      ::placeholder {
        color: ${Color.gray()};
      }
      ${isHighlighted
        ? `border: 2px solid ${Color.limeGreen(0.8)};`
        : hasError
        ? 'color: red; border: 1px solid red;'
        : ''};
    `}`;
  }, [className, isHighlighted, hasError]);

  const errorMessageStyle = useMemo(
    () => css`
      color: red;
      font-size: 1.3rem;
      margin-top: 0.5rem;
    `,
    []
  );

  useEffect(() => {
    const inputElement = actualInputRef.current;
    if (inputElement && type === 'number') {
      const preventWheel = (e: WheelEvent) => {
        e.preventDefault();
      };

      inputElement.addEventListener('wheel', preventWheel, { passive: false });

      return () => {
        inputElement.removeEventListener('wheel', preventWheel);
      };
    }
  }, [type, actualInputRef]);

  return (
    <ErrorBoundary componentPath="Input">
      <input
        {...props}
        {...iosKeyboardAttributes}
        name={props.name}
        type={type}
        autoComplete={autoCompleteValue}
        style={{
          lineHeight: '2rem',
          padding: '1rem',
          ...style
        }}
        className={inputClassName}
        ref={actualInputRef}
        onChange={handleChange}
      />
      {hasError && errorMessage && (
        <p className={errorMessageStyle}>{errorMessage}</p>
      )}
    </ErrorBoundary>
  );
}
