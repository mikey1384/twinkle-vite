import React, { useState } from 'react';
import SwitchButton from '~/components/Buttons/SwitchButton';
import { useAppContext, useKeyContext } from '~/contexts';
import { homePanelClass } from '~/theme/homePanels';

export default function WalkupsItem({ loading }: { loading: boolean }) {
  const userId = useKeyContext((v) => v.myState.userId);
  const allowed = useKeyContext((v) => v.myState.settings?.social?.walkups !== false);
  const updateSocialSettings = useAppContext(
    (v) => v.requestHelpers.updateSocialSettings
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <section className={homePanelClass} data-scroll-anchor-id="home-settings:walk-ups">
      <h2>Meet people in apps</h2>
      <SwitchButton
        ariaLabel="Let people walk up while I play"
        checked={allowed}
        disabled={loading || saving}
        label="Let people walk up while I play"
        onChange={handleToggle}
      />
      {failed && <span role="alert">Couldn’t save. Try again.</span>}
    </section>
  );

  async function handleToggle() {
    if (saving || !userId) return;
    setSaving(true);
    setFailed(false);
    try {
      const result = await updateSocialSettings({ walkups: !allowed });
      if (!result?.settings) {
        setFailed(true);
        return;
      }
      onSetUserState({ userId, newState: { settings: result.settings } });
    } catch {
      setFailed(true);
    } finally {
      setSaving(false);
    }
  }
}
