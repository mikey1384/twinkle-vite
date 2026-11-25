import React from 'react';
import Icon from '~/components/Icon';
import zeroGreet from '~/assets/welcome/zero-greet.webp';
import cielGreet from '~/assets/welcome/ciel-greet.webp';
import type { WelcomeTourGuide } from './rules';
import {
  GUIDE_COLOR,
  GUIDE_SOFT,
  boxClass,
  bottomDockClass,
  choiceButtonClass,
  choicesClass,
  closeClass,
  greeterWrapClass,
  lineClass,
  namePlateClass,
  quietRowClass,
  spriteClass
} from './styles';

export const GUIDE_PICTURE: Record<WelcomeTourGuide, string> = {
  zero: zeroGreet,
  ciel: cielGreet
};

// The dating-sim greeter: Zero and Ciel standing on the dialogue box, one
// line, and the member picks who shows them around.
export default function Greeter({
  line,
  onPick,
  onDecline
}: {
  line: string;
  onPick: (guide: WelcomeTourGuide) => void;
  onDecline: () => void;
}) {
  return (
    <div className={bottomDockClass} data-welcome-greeter="">
      <div className={greeterWrapClass} role="dialog" aria-label="Welcome from Zero and Ciel">
        <img className={spriteClass} data-side="left" src={zeroGreet} alt="Zero" />
        <img className={spriteClass} data-side="right" src={cielGreet} alt="Ciel" />
        <div className={boxClass}>
          <div className={namePlateClass}>
            <span className="zero">Zero</span>
            <span aria-hidden>&amp;</span>
            <span className="ciel">Ciel</span>
          </div>
          <button type="button" className={closeClass} aria-label="No thanks" onClick={onDecline}>
            <Icon icon="times" />
          </button>
          <p className={lineClass}>{line}</p>
          <div className={choicesClass}>
            {(['zero', 'ciel'] as WelcomeTourGuide[]).map((guide) => (
              <button
                key={guide}
                type="button"
                className={choiceButtonClass}
                style={
                  {
                    '--guide': GUIDE_COLOR[guide],
                    '--guide-soft': GUIDE_SOFT[guide]
                  } as React.CSSProperties
                }
                onClick={() => onPick(guide)}
              >
                <img src={GUIDE_PICTURE[guide]} alt="" />
                <span>Show me around, {guide === 'zero' ? 'Zero' : 'Ciel'}</span>
              </button>
            ))}
          </div>
          <div className={quietRowClass}>
            <button type="button" onClick={onDecline}>
              No thanks
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
