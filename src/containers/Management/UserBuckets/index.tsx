import React, { useEffect, useMemo, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import Loading from '~/components/Loading';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import UserSearchInput, {
  type UserSearchResult
} from '~/components/UserSearchInput';
import { Color } from '~/constants/css';
import { useAppContext } from '~/contexts';
import { AiEnergyManualIdentityBucket } from '../AiCosts/types';
import {
  actionsClass,
  emptyInlineClass,
  headerClass,
  identityToolClass,
  pageClass,
  panelClass,
  subsectionHeaderClass
} from '../AiCosts/styles';
import {
  addGridClass,
  banMessageClass,
  banMessageHintClass,
  banStatusClass,
  bucketSettingsClass,
  effectiveAccountsHintClass,
  emptyMembersClass,
  implicitMembershipWarningClass,
  memberListClass,
  memberRowClass,
  mergeFormClass,
  migrateCardClass,
  typeSummaryClass
} from './styles';

export default function UserBuckets() {
  const loadBucketsHelper = useAppContext(
    (v) => v.requestHelpers.loadAiEnergyManualIdentityBuckets
  );
  const createBucketHelper = useAppContext(
    (v) => v.requestHelpers.createAiEnergyManualIdentityBucket
  );
  const updateBucketHelper = useAppContext(
    (v) => v.requestHelpers.updateAiEnergyManualIdentityBucket
  );
  const setBanHelper = useAppContext(
    (v) => v.requestHelpers.setAiEnergyManualIdentityBucketBan
  );
  const addAccountHelper = useAppContext(
    (v) => v.requestHelpers.addAiEnergyManualIdentityAccount
  );
  const saveRuleHelper = useAppContext(
    (v) => v.requestHelpers.saveAiEnergyManualIdentityRule
  );
  const addIpHelper = useAppContext(
    (v) => v.requestHelpers.addAiEnergyManualIdentityIpSignal
  );
  const disableRuleHelper = useAppContext(
    (v) => v.requestHelpers.disableAiEnergyManualIdentityRule
  );
  const migrateLegacyHelper = useAppContext(
    (v) => v.requestHelpers.migrateLegacyBansIntoBucket
  );
  const mergeBucketsHelper = useAppContext(
    (v) => v.requestHelpers.mergeAiEnergyManualIdentityBuckets
  );

  const [buckets, setBuckets] = useState<AiEnergyManualIdentityBucket[]>([]);
  const [selectedBucketId, setSelectedBucketId] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [migrateMsg, setMigrateMsg] = useState('');
  const [newBucketLabel, setNewBucketLabel] = useState('');
  const [bucketNameDraft, setBucketNameDraft] = useState('');
  const [banScopeDraft, setBanScopeDraft] = useState<'full' | 'signup'>('full');
  const [banMessageDraft, setBanMessageDraft] = useState('');
  const [emailDraft, setEmailDraft] = useState('');
  const [ipDraft, setIpDraft] = useState('');
  const [ipIncludePrefix, setIpIncludePrefix] = useState(false);
  const [ipSignupOnly, setIpSignupOnly] = useState(false);
  const [deviceDraft, setDeviceDraft] = useState('');
  const [mergeMode, setMergeMode] = useState(false);
  const [mergeTargetId, setMergeTargetId] = useState(0);
  const [mergeName, setMergeName] = useState('');

  const selectedBucket = useMemo(
    () => buckets.find((bucket) => bucket.id === selectedBucketId) || null,
    [buckets, selectedBucketId]
  );

  useEffect(() => {
    loadBuckets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setBucketNameDraft(selectedBucket?.label || '');
    setBanScopeDraft(selectedBucket?.banScope || 'full');
    setBanMessageDraft(selectedBucket?.banMessage || '');
    setMergeMode(false);
    setMergeTargetId(0);
    setMergeName('');
  }, [
    selectedBucket?.id,
    selectedBucket?.label,
    selectedBucket?.banScope,
    selectedBucket?.banMessage
  ]);

  const exactAccountUserIds = useMemo(
    () =>
      (selectedBucket?.rules || [])
        .filter((rule) => rule.matchType === 'user')
        .map((rule) => Number(rule.userId || rule.matchValue))
        .filter(Boolean),
    [selectedBucket]
  );

  const effectiveAccounts = selectedBucket?.effectiveAccounts || [];
  const effectiveAccountCount =
    selectedBucket?.effectiveAccountCount ?? effectiveAccounts.length;
  const implicitAccountCount =
    selectedBucket?.implicitAccountCount ??
    effectiveAccounts.filter((account) => account.isImplicit).length;
  const ruleCount = (selectedBucket?.rules || []).length;

  const typeCounts = useMemo(() => {
    const counts = { user: 0, email: 0, ip: 0, other: 0 };
    for (const rule of selectedBucket?.rules || []) {
      if (rule.matchType === 'user') counts.user += 1;
      else if (rule.matchType === 'email') counts.email += 1;
      else if (rule.matchType === 'ip') counts.ip += 1;
      else counts.other += 1;
    }
    return counts;
  }, [selectedBucket]);

  return (
    <ErrorBoundary componentPath="Management/UserBuckets">
      <div className={pageClass}>
        <header className={headerClass}>
          <div>
            <h1>User Buckets</h1>
            <p>
              Buckets group a single actor across accounts, emails, and IPs. A
              full ban blocks sign-in, signup, and recovery; a signup-only ban
              leaves existing accounts alone while preventing new accounts.
              These are the same buckets used for AI cost attribution.
            </p>
          </div>
          <div className={actionsClass}>
            <Button
              color="logoBlue"
              variant="outline"
              loading={loading}
              onClick={() => loadBuckets()}
            >
              <Icon icon="sync" />
              <span style={{ marginLeft: '0.5rem' }}>Refresh</span>
            </Button>
          </div>
        </header>

        <div className={identityToolClass}>
          <div className="bucket-create-row">
            <label htmlFor="new-user-bucket-label">Create Bucket</label>
            <input
              id="new-user-bucket-label"
              value={newBucketLabel}
              onChange={(event) => setNewBucketLabel(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleCreateBucket();
              }}
              placeholder="New bucket name"
            />
            <Button
              color="logoBlue"
              variant="solid"
              loading={busy}
              disabled={busy || !newBucketLabel.trim()}
              onClick={handleCreateBucket}
            >
              Create Bucket
            </Button>
          </div>
          <div className="bucket-list-row">
            {loading ? (
              <div className="bucket-loading">
                <Loading />
              </div>
            ) : buckets.length === 0 ? (
              <div className={emptyMembersClass}>
                No buckets yet — create one above.
              </div>
            ) : (
              buckets.map((bucket) => {
                const accountCount =
                  bucket.effectiveAccountCount ??
                  (bucket.effectiveAccounts || []).length;
                const bucketRuleCount = (bucket.rules || []).length;
                return (
                  <button
                    key={bucket.id}
                    type="button"
                    className={bucket.id === selectedBucketId ? 'active' : ''}
                    onClick={() => setSelectedBucketId(bucket.id)}
                  >
                    <strong>{bucket.label}</strong>
                    <small>
                      {accountCount} account{accountCount === 1 ? '' : 's'} ·{' '}
                      {bucketRuleCount} rule{bucketRuleCount === 1 ? '' : 's'}
                    </small>
                    {bucket.isBanned ? (
                      <small
                        style={{
                          color:
                            bucket.banScope === 'signup'
                              ? Color.orange()
                              : Color.rose()
                        }}
                      >
                        <Icon icon="ban" />{' '}
                        {bucket.banScope === 'signup'
                          ? 'Signup blocked'
                          : 'Fully banned'}
                      </small>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
          {error ? <span>{error}</span> : null}
        </div>

        <div className={migrateCardClass}>
          <div className="migrate-text">
            <strong>Legacy bans</strong>
            {migrateMsg ? (
              <span className="migrate-result">{migrateMsg}</span>
            ) : (
              <span>
                Import old banned_ips / banned_emails entries into a single
                banned bucket so the new system is the one source of truth.
              </span>
            )}
          </div>
          <Button
            color="logoBlue"
            variant="soft"
            loading={busy}
            onClick={handleMigrateLegacy}
          >
            <Icon icon="sync" />
            Import legacy bans
          </Button>
        </div>

        {selectedBucket ? (
          <section className={panelClass}>
            <header>
              <div>
                <h2>{selectedBucket.label}</h2>
                <span>
                  {effectiveAccountCount} account
                  {effectiveAccountCount === 1 ? '' : 's'} · {ruleCount} rule
                  {ruleCount === 1 ? '' : 's'}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: '0.6rem',
                  flexWrap: 'wrap',
                  justifyContent: 'flex-end'
                }}
              >
                {buckets.length > 1 ? (
                  <Button
                    color="logoBlue"
                    variant="outline"
                    disabled={busy}
                    onClick={() => setMergeMode((value) => !value)}
                  >
                    <Icon icon="layer-group" />
                    Merge…
                  </Button>
                ) : null}
                {selectedBucket.isBanned ? (
                  <Button
                    color="green"
                    variant="solid"
                    loading={busy}
                    onClick={() => handleSetBan(false)}
                  >
                    <Icon icon="undo" />
                    Unban bucket
                  </Button>
                ) : (
                  <Button
                    color={banScopeDraft === 'signup' ? 'orange' : 'rose'}
                    variant="solid"
                    loading={busy}
                    disabled={busy || ruleCount === 0}
                    onClick={() => handleSetBan(true)}
                  >
                    <Icon icon="ban" />
                    {banScopeDraft === 'signup'
                      ? 'Block signups'
                      : 'Fully ban bucket'}
                  </Button>
                )}
              </div>
            </header>
            <div>
              {mergeMode ? (
                <div className={mergeFormClass}>
                  <div className="merge-field">
                    <label>Merge with</label>
                    <select
                      value={mergeTargetId || ''}
                      onChange={(event) =>
                        setMergeTargetId(Number(event.currentTarget.value))
                      }
                    >
                      <option value="">Select a bucket…</option>
                      {buckets
                        .filter((bucket) => bucket.id !== selectedBucket.id)
                        .map((bucket) => {
                          const accountCount =
                            bucket.effectiveAccountCount ??
                            (bucket.effectiveAccounts || []).length;
                          const bucketRuleCount = (bucket.rules || []).length;
                          return (
                            <option key={bucket.id} value={bucket.id}>
                              {bucket.label}
                              {bucket.isBanned
                                ? bucket.banScope === 'signup'
                                  ? ' (signup blocked)'
                                  : ' (fully banned)'
                                : ''}{' '}
                              · {accountCount} account
                              {accountCount === 1 ? '' : 's'} ·{' '}
                              {bucketRuleCount} rule
                              {bucketRuleCount === 1 ? '' : 's'}
                            </option>
                          );
                        })}
                    </select>
                  </div>
                  <div className="merge-field">
                    <label>New bucket name</label>
                    <input
                      value={mergeName}
                      onChange={(event) =>
                        setMergeName(event.currentTarget.value)
                      }
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') handleMergeBuckets();
                      }}
                      placeholder={`${selectedBucket.label} + …`}
                    />
                  </div>
                  <Button
                    color="logoBlue"
                    variant="solid"
                    loading={busy}
                    disabled={busy || !mergeTargetId || !mergeName.trim()}
                    onClick={handleMergeBuckets}
                  >
                    <Icon icon="layer-group" />
                    Merge buckets
                  </Button>
                  <Button
                    color="darkerGray"
                    variant="outline"
                    disabled={busy}
                    onClick={() => {
                      setMergeMode(false);
                      setMergeTargetId(0);
                      setMergeName('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : null}
              <div className={bucketSettingsClass}>
                <div className="bucket-setting">
                  <label htmlFor="selected-user-bucket-name">Bucket name</label>
                  <div className="bucket-setting-row">
                    <input
                      id="selected-user-bucket-name"
                      value={bucketNameDraft}
                      maxLength={120}
                      onChange={(event) =>
                        setBucketNameDraft(event.currentTarget.value)
                      }
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') handleRenameBucket();
                      }}
                    />
                    <Button
                      color="logoBlue"
                      variant="soft"
                      loading={busy}
                      disabled={
                        busy ||
                        !bucketNameDraft.trim() ||
                        bucketNameDraft.trim() === selectedBucket.label
                      }
                      onClick={handleRenameBucket}
                    >
                      Save name
                    </Button>
                  </div>
                </div>
                <div className="bucket-setting">
                  <label htmlFor="selected-user-bucket-ban-scope">
                    Restriction
                  </label>
                  <select
                    id="selected-user-bucket-ban-scope"
                    value={banScopeDraft}
                    disabled={busy}
                    onChange={(event) =>
                      setBanScopeDraft(
                        event.currentTarget.value === 'signup'
                          ? 'signup'
                          : 'full'
                      )
                    }
                  >
                    <option value="full">Full ban</option>
                    <option value="signup">Signups only</option>
                  </select>
                  <span>
                    {banScopeDraft === 'signup'
                      ? 'Blocks signup and signup verification emails. Existing accounts can sign in and recover access.'
                      : 'Blocks signup, sign-in, recovery, authenticated requests, and live sessions.'}
                  </span>
                </div>
              </div>
              <div
                className={`${banStatusClass} ${
                  selectedBucket.isBanned
                    ? selectedBucket.banScope === 'signup'
                      ? 'signup-only'
                      : 'banned'
                    : 'ok'
                }`}
              >
                <Icon icon={selectedBucket.isBanned ? 'ban' : 'check'} />
                <span>
                  {selectedBucket.isBanned
                    ? selectedBucket.banScope === 'signup'
                      ? 'Signup-only restriction is active — new accounts matching this bucket are blocked, while existing members remain active.'
                      : 'Full ban is active — members cannot sign in, create accounts, recover access, or remain connected.'
                    : 'This bucket is active. Members are not restricted.'}
                </span>
              </div>

              <div className={typeSummaryClass}>
                <div>
                  <span>Exact accounts</span>
                  <strong>{typeCounts.user}</strong>
                </div>
                <div>
                  <span>Emails</span>
                  <strong>{typeCounts.email}</strong>
                </div>
                <div>
                  <span>IPs</span>
                  <strong>{typeCounts.ip}</strong>
                </div>
                <div>
                  <span>Devices / prefixes</span>
                  <strong>{typeCounts.other}</strong>
                </div>
              </div>

              <div className={subsectionHeaderClass}>
                <h3>Ban message</h3>
                <span>Shown to blocked users</span>
              </div>
              <textarea
                className={banMessageClass}
                value={banMessageDraft}
                onChange={(event) =>
                  setBanMessageDraft(event.currentTarget.value)
                }
                placeholder="Leave empty to use the default message"
                rows={2}
              />
              {selectedBucket.isBanned ? (
                <div style={{ marginTop: '0.8rem' }}>
                  <Button
                    color="logoBlue"
                    variant="soft"
                    loading={busy}
                    disabled={
                      busy ||
                      (banMessageDraft.trim() ===
                        (selectedBucket.banMessage || '') &&
                        banScopeDraft === (selectedBucket.banScope || 'full'))
                    }
                    onClick={() => handleSetBan(true)}
                  >
                    Save ban settings
                  </Button>
                </div>
              ) : (
                <div className={banMessageHintClass}>
                  This message is shown when the selected restriction blocks a
                  request.
                </div>
              )}

              <div className={subsectionHeaderClass}>
                <h3>Effective accounts</h3>
                <span>{effectiveAccountCount} total</span>
              </div>
              <div className={effectiveAccountsHintClass}>
                Resolved from exact account and email rules. IP and device rules
                are request-specific, so they stay in the identity-rule list
                below instead of being guessed as permanent account members.
              </div>
              {implicitAccountCount > 0 ? (
                <div className={implicitMembershipWarningClass}>
                  <Icon icon="exclamation-triangle" />
                  <span>
                    {implicitAccountCount} account
                    {implicitAccountCount === 1 ? ' is' : 's are'} included by
                    an email rule rather than an exact account rule. Verify each
                    one belongs to the same person; shared email addresses can
                    otherwise combine unrelated AI batteries.
                  </span>
                </div>
              ) : null}
              {effectiveAccountCount === 0 ? (
                <div className={emptyMembersClass}>
                  No account or email rule currently resolves to an account.
                  Network and device rules, if any, are listed below.
                </div>
              ) : (
                <div className={memberListClass}>
                  {effectiveAccounts.map((account) => (
                    <div className={memberRowClass} key={account.userId}>
                      <div className="member-icon">
                        <Icon
                          icon={
                            account.isImplicit ? 'exclamation-triangle' : 'user'
                          }
                        />
                      </div>
                      <div className="member-main">
                        <strong>
                          {account.username
                            ? `@${account.username}`
                            : `Account #${account.userId}`}
                        </strong>
                        <span>
                          {account.isImplicit
                            ? `Included by email rule #${account.sourceRuleId}`
                            : `Exact account rule #${account.sourceRuleId}`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className={subsectionHeaderClass}>
                <h3>Identity rules</h3>
                <span>{ruleCount} total</span>
              </div>
              {ruleCount === 0 ? (
                <div className={emptyMembersClass}>
                  No identity rules yet. Add an exact account, email, IP, or
                  device below.
                </div>
              ) : (
                <div className={memberListClass}>
                  {(selectedBucket.rules || []).map((rule) => {
                    const view = memberView(rule);
                    return (
                      <div className={memberRowClass} key={rule.id}>
                        <div className="member-icon">
                          <Icon icon={view.icon} />
                        </div>
                        <div className="member-main">
                          <strong>{view.value}</strong>
                          <span>{view.label}</span>
                        </div>
                        <Button
                          color="rose"
                          variant="outline"
                          disabled={busy}
                          onClick={() => handleRemoveRule(Number(rule.id))}
                        >
                          <Icon icon="trash-alt" />
                          <span style={{ marginLeft: '0.5rem' }}>Remove</span>
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className={subsectionHeaderClass}>
                <h3>Add identity rules</h3>
              </div>
              <div className={addGridClass}>
                <div className="add-field">
                  <label>Exact account</label>
                  <UserSearchInput
                    excludeUserIds={exactAccountUserIds}
                    onSelect={handleAddAccount}
                    placeholder="Search users to add..."
                  />
                  <div className="add-hint">
                    Adds only the selected account. Email aliases are never
                    inferred.
                  </div>
                </div>

                <div className="add-field">
                  <label>Email</label>
                  <div className="add-row">
                    <input
                      value={emailDraft}
                      onChange={(event) =>
                        setEmailDraft(event.currentTarget.value)
                      }
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') handleAddEmail();
                      }}
                      placeholder="email@example.com"
                    />
                    <Button
                      color="logoBlue"
                      variant="soft"
                      disabled={busy || !emailDraft.trim()}
                      onClick={handleAddEmail}
                    >
                      <Icon icon="plus" />
                      <span style={{ marginLeft: '0.5rem' }}>Add</span>
                    </Button>
                  </div>
                  <div className="add-warn">
                    An email rule includes every account that resolves to that
                    address. Use it only after verifying they are the same
                    person.
                  </div>
                </div>

                <div className="add-field">
                  <label>IP address</label>
                  <div className="add-row">
                    <input
                      value={ipDraft}
                      onChange={(event) =>
                        setIpDraft(event.currentTarget.value)
                      }
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') handleAddIp();
                      }}
                      placeholder="203.0.113.7"
                    />
                    <Button
                      color="logoBlue"
                      variant="soft"
                      disabled={busy || !ipDraft.trim()}
                      onClick={handleAddIp}
                    >
                      <Icon icon="plus" />
                      <span style={{ marginLeft: '0.5rem' }}>Add</span>
                    </Button>
                  </div>
                  <label className="prefix-toggle">
                    <input
                      type="checkbox"
                      checked={ipIncludePrefix}
                      onChange={(event) =>
                        setIpIncludePrefix(event.currentTarget.checked)
                      }
                    />
                    Also ban whole prefix (/24)
                  </label>
                  <label className="prefix-toggle">
                    <input
                      type="checkbox"
                      checked={ipSignupOnly}
                      onChange={(event) =>
                        setIpSignupOnly(event.currentTarget.checked)
                      }
                    />
                    Signup-only (block account creation, not login/recovery)
                  </label>
                  {ipIncludePrefix ? (
                    <div className="add-warn">
                      Prefix bans can also block unrelated users sharing the
                      same network (carrier / school / NAT). Use exact IP unless
                      you are sure.
                    </div>
                  ) : null}
                </div>

                <div className="add-field">
                  <label>Device ID</label>
                  <div className="add-row">
                    <input
                      value={deviceDraft}
                      onChange={(event) =>
                        setDeviceDraft(event.currentTarget.value)
                      }
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') handleAddDevice();
                      }}
                      placeholder="Device id (from cost evidence)"
                    />
                    <Button
                      color="logoBlue"
                      variant="soft"
                      disabled={busy || !deviceDraft.trim()}
                      onClick={handleAddDevice}
                    >
                      <Icon icon="plus" />
                      <span style={{ marginLeft: '0.5rem' }}>Add</span>
                    </Button>
                  </div>
                  <div className="add-hint">
                    Survives IP changes, but the device id is client-supplied
                    and can be cleared. Use alongside account/email bans.
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <div className={emptyInlineClass}>
            Select a bucket to manage its members and ban status.
          </div>
        )}
      </div>
    </ErrorBoundary>
  );

  function memberView(rule: {
    matchType?: string;
    matchValue?: string;
    username?: string;
    userId?: number;
    riskKeyType?: string;
    riskKeyHash?: string;
    note?: string;
    scope?: string;
  }): { icon: string; label: string; value: string } {
    const signupOnly =
      selectedBucket?.banScope === 'signup' || rule.scope === 'signup';
    if (rule.matchType === 'user') {
      return {
        icon: 'user',
        label: 'Exact account',
        value: rule.username
          ? `@${rule.username}`
          : `#${rule.userId || rule.matchValue}`
      };
    }
    if (rule.matchType === 'email') {
      return {
        icon: 'paper-plane',
        label: signupOnly ? 'Email rule · signup-only' : 'Email rule',
        value: String(rule.matchValue || '')
      };
    }
    if (rule.matchType === 'ip') {
      return {
        icon: 'globe',
        label: signupOnly ? 'IP (exact) · signup-only' : 'IP (exact)',
        value: String(rule.matchValue || '')
      };
    }
    if (rule.riskKeyType === 'device_id') {
      return {
        icon: 'mobile-alt',
        label: signupOnly ? 'Device · signup-only' : 'Device',
        value:
          (rule.note || '').replace(/^Device\s+/i, '') ||
          (rule.riskKeyHash || '').slice(0, 12)
      };
    }
    return {
      icon: 'globe',
      label: signupOnly ? 'IP prefix · signup-only' : 'IP prefix',
      value: rule.note || rule.riskKeyType || 'prefix'
    };
  }

  async function handleAddDevice() {
    const deviceId = deviceDraft.trim();
    if (!selectedBucket || !deviceId || busy) return;
    setBusy(true);
    setError('');
    try {
      await saveRuleHelper({
        bucketId: selectedBucket.id,
        matchType: 'risk_key',
        riskKeyType: 'device_id',
        riskKeyValue: deviceId,
        note: `Device ${deviceId}`
      });
      setDeviceDraft('');
      await loadBuckets(selectedBucket.id);
    } catch {
      setError('Failed to add device.');
    } finally {
      setBusy(false);
    }
  }

  async function loadBuckets(preferredId?: number) {
    setLoading(true);
    setError('');
    try {
      const data = await loadBucketsHelper({
        bucketId: preferredId ?? selectedBucketId,
        days: 30
      });
      const nextBuckets: AiEnergyManualIdentityBucket[] = data?.buckets || [];
      setBuckets(nextBuckets);
      setSelectedBucketId(data?.selectedBucketId || nextBuckets[0]?.id || 0);
    } catch {
      setError('Failed to load buckets.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateBucket() {
    const label = newBucketLabel.trim();
    if (!label || busy) return;
    setBusy(true);
    setError('');
    try {
      const data = await createBucketHelper({ label });
      setNewBucketLabel('');
      await loadBuckets(data?.bucket?.id);
    } catch {
      setError('Failed to create bucket.');
    } finally {
      setBusy(false);
    }
  }

  async function handleRenameBucket() {
    const label = bucketNameDraft.trim();
    if (!selectedBucket || !label || label === selectedBucket.label || busy) {
      return;
    }
    setBusy(true);
    setError('');
    try {
      await updateBucketHelper({
        bucketId: selectedBucket.id,
        label
      });
      await loadBuckets(selectedBucket.id);
    } catch (renameError: any) {
      setError(renameError?.message || 'Failed to rename bucket.');
    } finally {
      setBusy(false);
    }
  }

  async function handleMigrateLegacy() {
    if (busy) return;
    setBusy(true);
    setError('');
    setMigrateMsg('');
    try {
      const result = await migrateLegacyHelper();
      const parts: string[] = [];
      const fullIpCount =
        (result?.migratedIps || 0) + (result?.migratedSignupIps || 0);
      if (fullIpCount) {
        parts.push(`${fullIpCount} IP${fullIpCount === 1 ? '' : 's'}`);
      }
      if (result?.migratedEmails) {
        parts.push(
          `${result.migratedEmails} email${
            result.migratedEmails === 1 ? '' : 's'
          }`
        );
      }
      let message = parts.length
        ? `Imported ${parts.join(' + ')} into "${result.bucketLabel}".`
        : 'No legacy IP/email bans to import.';
      if (result?.migratedSignupIps) {
        message += ` ${result.migratedSignupIps} kept signup-only scope.`;
      }
      if (parts.length && result?.banned === false && result?.banError) {
        message += ` Imported but not auto-banned: ${result.banError}`;
      }
      if (result?.failed) {
        message += ` ${result.failed} row${
          result.failed === 1 ? '' : 's'
        } skipped (invalid).`;
      }
      setMigrateMsg(message);
      await loadBuckets(result?.bucketId || undefined);
    } catch {
      setError('Failed to import legacy bans.');
    } finally {
      setBusy(false);
    }
  }

  async function handleMergeBuckets() {
    const label = mergeName.trim();
    if (!selectedBucket || !mergeTargetId || !label || busy) return;
    setBusy(true);
    setError('');
    try {
      const result = await mergeBucketsHelper({
        sourceBucketIds: [selectedBucket.id, mergeTargetId],
        label
      });
      setMergeMode(false);
      setMergeTargetId(0);
      setMergeName('');
      await loadBuckets(result?.bucketId || undefined);
    } catch (mergeError: any) {
      // A failed re-ban aborts the merge server-side (sources untouched) and
      // rejects with a reason — surface it. The reject skips loadBuckets above,
      // so nothing clears this error.
      setError(mergeError?.message || 'Failed to merge buckets.');
    } finally {
      setBusy(false);
    }
  }

  async function handleSetBan(isBanned: boolean) {
    if (!selectedBucket || busy) return;
    setBusy(true);
    setError('');
    try {
      await setBanHelper({
        bucketId: selectedBucket.id,
        isBanned,
        banScope: banScopeDraft,
        banMessage: banMessageDraft.trim()
      });
      await loadBuckets(selectedBucket.id);
    } catch (banError: any) {
      setError(banError?.message || 'Failed to update ban status.');
    } finally {
      setBusy(false);
    }
  }

  async function handleAddAccount(user: UserSearchResult) {
    if (!selectedBucket || busy) return;
    setBusy(true);
    setError('');
    try {
      await addAccountHelper({ bucketId: selectedBucket.id, userId: user.id });
      await loadBuckets(selectedBucket.id);
    } catch {
      setError('Failed to add account.');
    } finally {
      setBusy(false);
    }
  }

  async function handleAddEmail() {
    const email = emailDraft.trim();
    if (!selectedBucket || !email || busy) return;
    setBusy(true);
    setError('');
    try {
      await saveRuleHelper({
        bucketId: selectedBucket.id,
        matchType: 'email',
        email
      });
      setEmailDraft('');
      await loadBuckets(selectedBucket.id);
    } catch {
      setError('Failed to add email.');
    } finally {
      setBusy(false);
    }
  }

  async function handleAddIp() {
    const ip = ipDraft.trim();
    if (!selectedBucket || !ip || busy) return;
    setBusy(true);
    setError('');
    try {
      await addIpHelper({
        bucketId: selectedBucket.id,
        ip,
        includePrefix: ipIncludePrefix,
        scope: ipSignupOnly ? 'signup' : 'full'
      });
      setIpDraft('');
      await loadBuckets(selectedBucket.id);
    } catch {
      setError('Failed to add IP.');
    } finally {
      setBusy(false);
    }
  }

  async function handleRemoveRule(ruleId: number) {
    if (!selectedBucket || !ruleId || busy) return;
    setBusy(true);
    setError('');
    try {
      await disableRuleHelper(ruleId);
      await loadBuckets(selectedBucket.id);
    } catch {
      setError('Failed to remove identity rule.');
    } finally {
      setBusy(false);
    }
  }
}
