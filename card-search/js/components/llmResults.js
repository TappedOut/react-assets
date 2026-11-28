import React from 'react';
import MatchFeedback from '../../../set-detail/js/components/matchFeedback.js';


// The AI tab's one result view, modelled on the draft page's pack grid (campodraft public/css/app.css .cards/.card):
// cards ~140 px and up, 16 px row / 14 px column gap; 2 columns on phones, 3 from 420 px. Hovering lifts and tilts
// a card under the pointer with a soft glare (not on touch, not with reduced motion); clicking a card opens a
// large view, Escape or a click closes it. Under each card: its name (link to the card page) and the lowest price.
// "Does it match your search?" (the user's pick, 2026-11-28: calmer than a vote under every card): one line above
// the grid asks; a card's Yes/No shows when the pointer is over it or focus is inside it (still in the tab order and
// read by screen readers, only transparent until then; it stays once voted). On touch screens it's in the large
// view instead. The vote data is the same as before (onVote(pk, 'correct' | 'incorrect' | 'clear')).
const CSS = `
.llm-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 16px 14px;
  margin: 4px 0 24px; padding: 0; list-style: none; }
.llm-cards .llm-card { --rx: 0deg; --ry: 0deg; display: block; width: 100%; padding: 0; border: 0; background: none;
  perspective: 800px; border-radius: 4.8% / 3.5%; cursor: zoom-in; }
.llm-cards .llm-face { --mx: 50%; --my: 50%; position: relative; display: block; overflow: hidden; aspect-ratio: 63 / 88;
  border-radius: 4.8% / 3.5%; background: linear-gradient(160deg, #2b3641, #1b222a);
  box-shadow: 0 6px 16px rgba(0, 0, 0, .42); transform: rotateX(var(--rx)) rotateY(var(--ry));
  transition: transform .18s ease-out, box-shadow .2s ease; }
.llm-cards .llm-card:hover .llm-face, .llm-cards .llm-card:focus-visible .llm-face {
  transform: translateY(-8px) scale(1.045) rotateX(var(--rx)) rotateY(var(--ry));
  box-shadow: 0 24px 44px rgba(0, 0, 0, .6); }
.llm-cards .llm-card:hover, .llm-cards .llm-card:focus-visible { position: relative; z-index: 3; }
.llm-face img { position: relative; display: block; width: 100%; height: 100%; object-fit: cover; }
.llm-face .llm-alt { position: absolute; inset: 0; display: grid; place-items: center; padding: 10px; color: #9aa5b1;
  font-size: 13px; text-align: center; }
.llm-face .llm-glare { position: absolute; inset: 0; pointer-events: none; opacity: 0; transition: opacity .2s;
  background: radial-gradient(circle at var(--mx) var(--my), rgba(255, 255, 255, .34), transparent 48%);
  mix-blend-mode: soft-light; }
.llm-card:hover .llm-glare { opacity: 1; }
.llm-meta { display: flex; align-items: baseline; gap: 6px; margin: 6px 0 4px; font-size: 12px; color: #9aa5b1; }
.llm-meta a { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #e9e4d8; }
.llm-meta .llm-price { flex: none; }
.llm-overlay { position: fixed; z-index: 1050; inset: 0; display: grid; place-content: center; justify-items: center;
  gap: 14px; padding: 16px; background: rgba(8, 10, 13, .93); cursor: zoom-out; }
.llm-overlay img { width: min(86vw, 400px); border-radius: 4.8% / 3.5%; box-shadow: 0 30px 80px #000; }
.llm-overlay a { color: #e3b85f; font-size: 15px; }
.llm-overlay:focus { outline: none; }
@media (max-width: 600px) { .llm-cards { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 10px; } }
@media (min-width: 420px) and (max-width: 600px) { .llm-cards { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (prefers-reduced-motion: reduce) { .llm-cards *, .llm-overlay * { transition: none !important; } }
.llm-hint { margin: 0 0 10px; font-size: 13px; color: #9aa5b1; }
.llm-hint .llm-touch { display: none; }
@media (hover: hover) and (pointer: fine) {
  .llm-cards .llm-vote { opacity: 0; transition: opacity .15s; }
  .llm-cards li:hover .llm-vote, .llm-cards li:focus-within .llm-vote, .llm-cards .llm-vote.llm-voted { opacity: 1; }
}
@media (hover: none), (pointer: coarse) {
  .llm-hint .llm-touch { display: inline; }
  .llm-hint .llm-pointer, .llm-cards .llm-vote { display: none; }
}
.llm-overlay .llm-vote { width: min(86vw, 400px); cursor: auto; }
`

const price = (spec) => {
  const p = parseFloat(spec.tcg_market_price || spec.ck_price)
  return p > 0 ? `$${p.toFixed(2)}` : ''
}

export default class LLMResults extends React.Component {
  state = {zoomed: null}

  componentDidMount() {
    this.reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    document.addEventListener('keydown', this.onKey)
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.onKey)
  }

  // The zoom overlay is a modal dialog for keyboard users too: focus moves into it on open, Tab stays inside it,
  // Escape (or Close, or a click) closes it, and focus goes back to the card that opened it.
  componentDidUpdate(prevProps, prevState) {
    if (this.state.zoomed && !prevState.zoomed && this.overlay) this.overlay.focus()
    if (!this.state.zoomed && prevState.zoomed && this.opener) { this.opener.focus(); this.opener = null }
  }

  open = (spec, e) => {
    this.opener = e && e.currentTarget
    this.setState({zoomed: spec})
  }

  close = () => this.setState({zoomed: null})

  onKey = (e) => {
    if (!this.state.zoomed) return
    if (e.key === 'Escape') { this.close(); return }
    if (e.key === 'Tab' && this.overlay) {
      const items = Array.prototype.slice.call(this.overlay.querySelectorAll('a[href], button:not([disabled])'))  // a disabled button can't take focus: skipping it keeps Close reachable while a vote is being sent
      if (!items.length) return
      const i = items.indexOf(document.activeElement)
      const next = e.shiftKey ? (i <= 0 ? items.length - 1 : i - 1) : (i === -1 || i === items.length - 1 ? 0 : i + 1)
      e.preventDefault()
      items[next].focus()
    }
  }

  tilt = (e) => {
    if (this.reduced || e.pointerType === 'touch') return
    const card = e.currentTarget, box = card.getBoundingClientRect(), face = card.firstChild
    const x = (e.clientX - box.left) / box.width, y = (e.clientY - box.top) / box.height
    card.style.setProperty('--ry', ((x - .5) * 20).toFixed(1) + 'deg')
    card.style.setProperty('--rx', ((.5 - y) * 16).toFixed(1) + 'deg')
    face.style.setProperty('--mx', (x * 100).toFixed(0) + '%')
    face.style.setProperty('--my', (y * 100).toFixed(0) + '%')
  }

  untilt = (e) => {
    e.currentTarget.style.removeProperty('--rx')
    e.currentTarget.style.removeProperty('--ry')
  }

  render() {
    const {specs, votes, onVote, feedback_enabled} = this.props
    const zoomed = this.state.zoomed
    return (
      <div>
        <style>{CSS}</style>
        {onVote &&
          <p className="llm-hint">
            <span className="llm-pointer">Does a card match your search? Point at it, tab to it, or open it to tell us.</span>
            <span className="llm-touch">Does a card match your search? Open it to tell us.</span>
          </p>}
        <ul className="llm-cards">
          {specs.map(spec => (
            <li key={spec.pk}>
              <button type="button" className="llm-card" aria-label={`Look closer at ${spec.name}`}
                      onPointerMove={this.tilt} onPointerLeave={this.untilt}
                      onClick={(e) => this.open(spec, e)}>
                <span className="llm-face">
                  <span className="llm-alt">{spec.name}</span>
                  {spec.image && <img src={spec.image} alt="" loading="lazy" />}
                  <i className="llm-glare" />
                </span>
              </button>
              <div className="llm-meta">
                <a href={spec.url} title={spec.name}>{spec.name}</a>
                {price(spec) && <span className="llm-price">{price(spec)}</span>}
              </div>
              {onVote &&
                <div className={'llm-vote' + ((votes || {})[spec.pk] ? ' llm-voted' : '')}>
                  <MatchFeedback compact pk={spec.pk} name={spec.name} vote={(votes || {})[spec.pk]}
                                 onVote={onVote} disabled={!feedback_enabled} />
                </div>}
            </li>
          ))}
        </ul>
        {zoomed &&
          <div className="llm-overlay" role="dialog" aria-modal="true" aria-label={zoomed.name} tabIndex={-1}
               ref={el => { this.overlay = el }} onClick={this.close}>
            {zoomed.image && <img src={zoomed.image_large || zoomed.image} alt={zoomed.name} />}
            <a href={zoomed.url} onClick={e => e.stopPropagation()}>{zoomed.name}: card page, prices and decks</a>
            {onVote &&
              <div className="llm-vote" onClick={e => e.stopPropagation()}>
                <MatchFeedback compact prompt pk={zoomed.pk} name={zoomed.name} vote={(votes || {})[zoomed.pk]}
                               onVote={onVote} disabled={!feedback_enabled} />
              </div>}
            <button type="button" className="btn btn-default btn-sm llm-close" onClick={this.close}>Close</button>
          </div>}
      </div>
    )
  }
}
