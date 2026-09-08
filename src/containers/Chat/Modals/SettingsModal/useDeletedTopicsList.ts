import { useEffect, useRef, useState } from 'react';

// A dismissed list or a different actor/channel must not accept an old read.
export default function useDeletedTopicsList(scope: string, load: () => Promise<any>) {
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const generation = useRef(0);
  const latestScope = useRef(scope);
  latestScope.current = scope;
  useEffect(() => {
    setTopics([]);
    setLoading(false);
    setError('');
    return () => { generation.current++; };
  }, [scope]);
  return { topics, loading, error, reload, invalidate };

  function invalidate() {
    generation.current++;
    setLoading(false);
  }

  async function reload() {
    const version = ++generation.current;
    const current = () => version === generation.current && scope === latestScope.current;
    setLoading(true);
    setError('');
    try {
      const result = await load();
      if (!current()) return;
      if (!Array.isArray(result) || result.some(topic =>
        !topic || !Number.isSafeInteger(topic.id) || topic.id <= 0 || typeof topic.content !== 'string'
      )) throw new Error('Invalid deleted topics response');
      setTopics(result);
    } catch {
      if (current()) setError('Couldn’t load deleted topics. Please try again.');
    } finally {
      if (current()) setLoading(false);
    }
  }
}
