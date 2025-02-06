import React, { useMemo } from 'react';

export default function PosBlock({
  pos,
  wordObj
}: {
  pos: string;
  wordObj: any;
}) {
  const {
    noun = [],
    verb = [],
    adjective = [],
    preposition = [],
    adverb = [],
    pronoun = [],
    conjunction = [],
    interjection = [],
    phrase = [],
    other = [],
    deletedDefIds = [],
    definitionOrder
  } = wordObj;
  const partOfSpeeches = useMemo<{
    [key: string]: any[];
  }>(() => {
    return {
      noun,
      verb,
      adjective,
      preposition,
      adverb,
      pronoun,
      conjunction,
      interjection,
      phrase,
      other
    };
  }, [
    adjective,
    adverb,
    conjunction,
    interjection,
    noun,
    other,
    phrase,
    preposition,
    pronoun,
    verb
  ]);

  const posObj = useMemo(() => {
    const result: { [key: string]: any } = {
      adjective: {},
      adverb: {},
      conjunction: {},
      interjection: {},
      noun: {},
      preposition: {},
      pronoun: {},
      verb: {},
      phrase: {},
      other: {}
    };
    for (const key in partOfSpeeches) {
      for (const { id, definition } of partOfSpeeches[key]) {
        result[key][id] = {
          id,
          title: definition
        };
      }
    }
    return result;
  }, [partOfSpeeches]);

  const Definitions = useMemo(() => {
    const definitionIds = definitionOrder?.[pos];
    if (definitionIds) {
      return definitionIds
        .filter(
          (id: number) => !deletedDefIds.includes(id) && !!posObj[pos][id]
        )
        .map((id: number, index: number) => (
          <div key={id}>
            {index + 1}. {posObj[pos][id]?.title}
          </div>
        ));
    }
    return wordObj[pos]
      .filter(({ id }: { id: number }) => !deletedDefIds.includes(id))
      .map(
        (
          {
            id,
            definition
          }: {
            id: number;
            definition: string;
          },
          index: number
        ) => (
          <div key={id}>
            {index + 1}. {definition}
          </div>
        )
      );
  }, [definitionOrder, deletedDefIds, pos, posObj, wordObj]);

  return (
    <section key={pos}>
      <p style={{ fontSize: '1.7rem', fontStyle: 'italic' }}>{pos}</p>
      <div
        style={{
          width: '80%',
          padding: '1rem',
          height: '100%',
          overflow: 'scroll'
        }}
      >
        {Definitions}
      </div>
    </section>
  );
}
