import React, { useMemo } from 'react';
import PropTypes from 'prop-types';

PosBlock.propTypes = {
  pos: PropTypes.string,
  wordObj: PropTypes.object.isRequired
};

export default function PosBlock({ pos, wordObj }) {
  const {
    noun = [],
    verb = [],
    adjective = [],
    preposition = [],
    adverb = [],
    pronoun = [],
    conjunction = [],
    interjection = [],
    other = [],
    deletedDefIds = [],
    definitionOrder
  } = wordObj;
  const partOfSpeeches = useMemo(() => {
    return {
      noun,
      verb,
      adjective,
      preposition,
      adverb,
      pronoun,
      conjunction,
      interjection,
      other
    };
  }, [
    adjective,
    adverb,
    conjunction,
    interjection,
    noun,
    other,
    preposition,
    pronoun,
    verb
  ]);

  const posObj = useMemo(() => {
    const result = {
      adjective: {},
      adverb: {},
      conjunction: {},
      interjection: {},
      noun: {},
      preposition: {},
      pronoun: {},
      verb: {},
      other: {}
    };
    for (let key in partOfSpeeches) {
      for (let { id, definition } of partOfSpeeches[key]) {
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
        .filter((id) => !deletedDefIds.includes(id) && !!posObj[pos][id])
        .map((id, index) => (
          <div key={id}>
            {index + 1}. {posObj[pos][id]?.title}
          </div>
        ));
    }
    return wordObj[pos]
      .filter(({ id }) => !deletedDefIds.includes(id))
      .map(({ id, definition }, index) => (
        <div key={id}>
          {index + 1}. {definition}
        </div>
      ));
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
