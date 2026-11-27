import React from 'react';


// "Does this card match your AI search?" on each AI search result.
// vote: 'correct' | 'incorrect' | undefined. Clicking the chosen button again takes the vote back ('clear');
// clicking the other one switches it. onVote(pk, action) sends it (card_search.sendFeedback).
// The visible text is the short "Yes" / "No" under the "Matches your search?" prompt (one line even at
// ~300 px card width); the full wording stays in the tooltip and the screen-reader label.
const BUTTONS = [
  {action: 'correct', emoji: '👍', label: 'Yes, it matches', short: 'Yes', on: 'btn-success'},
  {action: 'incorrect', emoji: '👎', label: "Doesn't match", short: 'No', on: 'btn-danger'},
]

export default class MatchFeedback extends React.Component {
  render() {
    const {pk, vote, compact, disabled, onVote} = this.props
    const buttons = BUTTONS.map(b => {
      const selected = vote === b.action
      const title = selected ? `${b.label} (your answer; click again to undo)` : `${b.label}: tell us whether this card fits your search`
      return (
        <button
          key={b.action}
          type="button"
          className={`btn btn-sm ${selected ? b.on : 'btn-default'}`}
          style={{flex: compact ? '0 0 auto' : '1 1 0', minWidth: 0, whiteSpace: 'nowrap',
                  fontWeight: selected ? 'bold' : 'normal'}}
          aria-pressed={selected}
          aria-label={title}
          title={title}
          disabled={disabled}
          onClick={() => onVote(pk, selected ? 'clear' : b.action)}
        >
          <span aria-hidden="true">{b.emoji}</span>&nbsp;{b.short}
        </button>
      )
    })
    return (
      <div role="group" aria-label="Does this card match your search?"
           style={{padding: compact ? 0 : '6px 4px 4px', textAlign: compact ? 'left' : 'center'}}>
        {/* In the table the column header already asks; only the thanks shows there. */}
        {(vote || !compact) &&
          <div style={{fontSize: '12px', color: vote ? '#8fd18f' : '#bbb', marginBottom: '4px'}} aria-live="polite">
            {vote ? 'Thanks, noted' : 'Matches your search?'}
          </div>}
        <div style={{display: 'flex', gap: '4px'}}>{buttons}</div>
      </div>
    )
  }
}
