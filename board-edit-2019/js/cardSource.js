import React from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

// "Cards from": where the deck editors' search and add-card autocomplete look for cards (Lists in the deck builder,
// phase 1; design in tappedout ~/notes/lists-in-deck-builder.md). Used by both editors (board-edit-2019 and
// board_editor).
//   all   - every card (today's default)
//   inv   - My inventory (today's "Restrict to my Inventory"; the editors keep their inventory URLs for it)
//   lists - one or more of your own Lists or Lists shared with you: search and autocomplete get
//           source=lists&lists=<ids>, and each result says which of those Lists it's in (in_lists).
// With no List picked the Lists source is off (the user's rule): the picker says so and keeps the previous source.

export const DEFAULT_SOURCE = {source: 'all', lists: []};

// tappedout's board_edit_init keys, wherever the editor keeps them (the older editor nests some under "django").
export function initValue(initData, key) {
  if (!initData) return null;
  if (initData[key] !== undefined) return initData[key];
  return initData.django ? (initData.django[key] === undefined ? null : initData.django[key]) : null;
}

export function initialSource(initData) {
  const saved = initValue(initData, 'card_source');
  if (!saved || !saved.source) return DEFAULT_SOURCE;
  if (saved.source === 'lists' && !(saved.lists && saved.lists.length)) return DEFAULT_SOURCE;
  return {source: saved.source, lists: saved.lists || []};
}

// Extra query parameters for the card search and autocomplete ('' unless Lists are the source).
export function sourceParams(cardSource) {
  if (!cardSource || cardSource.source !== 'lists' || !cardSource.lists.length) return '';
  return `source=lists&lists=${cardSource.lists.join(',')}`;
}

export function withSourceParams(url, cardSource) {
  const params = sourceParams(cardSource);
  if (!params) return url;
  return url + (url.indexOf('?') === -1 ? '?' : '&') + params;
}

// The API's own message for a refused Lists pick (400 "pick at least one List" / "bad list id" / "too many Lists",
// 404 "List not found"), or null for any other error.
export function sourceError(error) {
  const r = error && error.response;
  if (!r || (r.status !== 400 && r.status !== 404) || !r.data || !r.data.source) return null;
  return Array.isArray(r.data.source) ? r.data.source.join(' ') : String(r.data.source);
}

// Remember the deck owner's choice (card_source_save_url is null for anyone else).
export function saveSource(initData, cardSource) {
  const url = initValue(initData, 'card_source_save_url');
  if (!url) return Promise.resolve(null);
  const body = cardSource.source === 'lists' ? cardSource : {source: cardSource.source};
  return axios.post(url, body, {headers: {'X-CSRFToken': Cookies.get('csrftoken')}}).catch(() => null);
}

// "in: Gruul staples ×4, Mana catalogue (friend)": which picked Lists a found card is in.
export function ListsBadge({inLists}) {
  if (!inLists || !inLists.length) return null;
  const text = inLists.map(l => `${l.name}${l.qty > 1 ? ` ×${l.qty}` : ''}`).join(', ');
  return (
    <div className="card-source-in small text-muted" title={`In your Lists: ${text}`}>
      in: {text}
    </div>
  );
}

const PANEL_CSS = `
.card-source { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; }
.card-source label { margin: 0; font-weight: normal; }
.card-source select { width: auto; display: inline-block; height: 30px; padding: 4px 8px; }
.card-source-summary { font-size: 12px; opacity: .85; }
.card-source-summary button { padding: 0 4px; font-size: 12px; vertical-align: baseline; }
.card-source-panel { position: absolute; z-index: 1060; margin-top: 4px; width: min(360px, 92vw); max-height: 60vh;
  display: flex; flex-direction: column; padding: 10px; border-radius: 6px; box-shadow: 0 10px 30px rgba(0,0,0,.45);
  background: #2e3338; color: #dcdcdc; border: 1px solid rgba(255,255,255,.12); }
.card-source-panel.light { background: #fff; color: #2b2b2b; border-color: #ccc; }
.card-source-panel .cs-search { margin-bottom: 8px; }
.card-source-panel .cs-groups { overflow: auto; flex: 1 1 auto; }
.card-source-panel fieldset { margin: 0 0 8px; padding: 0; border: 0; }
.card-source-panel legend { font-size: 11px; text-transform: uppercase; letter-spacing: .05em; margin: 0 0 4px;
  border: 0; color: inherit; opacity: .75; width: auto; text-align: left; }
.card-source-panel, .card-source-panel .cs-item { text-align: left; }
.card-source-panel .cs-item { display: flex; gap: 8px; align-items: baseline; padding: 3px 2px; font-weight: normal; }
.card-source-panel .cs-item input { margin: 0; }
.card-source-panel .cs-meta { font-size: 11px; opacity: .7; margin-left: auto; white-space: nowrap; }
.card-source-panel .cs-actions { display: flex; gap: 6px; justify-content: flex-end; align-items: center; margin-top: 8px; }
.card-source-panel .cs-error { color: #ff7d7d; font-size: 12px; margin-right: auto; }
.card-source-panel.light .cs-error { color: #b3261e; }
.card-source-in { margin-top: 2px; font-size: 11px; line-height: 1.3; }
`;

// Props: value ({source, lists}), listsUrl (null when logged out: the Lists choice is then disabled),
// onChange(newValue), idPrefix (unique per editor instance).
export class CardSourcePicker extends React.Component {
  state = {open: false, lists: null, loading: false, loadError: null, picked: [], filter: '', error: null};

  componentDidMount() {
    document.addEventListener('keydown', this.onKey);
    if (this.props.value.source === 'lists') this.loadLists();  // to show names, and to drop Lists that are gone
  }

  componentDidUpdate(prevProps) {
    if (this.props.value.source === 'lists' && prevProps.value.source !== 'lists') this.loadLists();
  }

  // A remembered List that's no longer yours or shared with you (deleted, unshared) is dropped quietly; with none
  // left the source goes back to All cards (Tess, 2026-11-28).
  prune = (lists) => {
    const {value} = this.props;
    if (value.source !== 'lists') return;
    const known = lists.own.concat(lists.shared).map(l => l.id);
    const keep = value.lists.filter(id => known.indexOf(id) !== -1);
    if (keep.length === value.lists.length) return;
    this.props.onChange(keep.length ? {source: 'lists', lists: keep} : DEFAULT_SOURCE);
  };
  componentWillUnmount() { document.removeEventListener('keydown', this.onKey); }

  onKey = (e) => { if (this.state.open && e.key === 'Escape') this.cancel(); };

  loadLists = () => {
    if (this.state.lists || this.state.loading || !this.props.listsUrl) return;
    this.setState({loading: true, loadError: null});
    axios.get(this.props.listsUrl).then(
      r => {
        const lists = {own: r.data.own || [], shared: r.data.shared || []};
        this.setState({lists, loading: false}, () => this.prune(lists));
      },
      () => this.setState({loading: false, loadError: 'Your Lists could not be loaded. Try again in a moment.'})
    );
  };

  openPanel = () => {
    this.loadLists();
    this.setState({open: true, picked: (this.props.value.lists || []).slice(), filter: '', error: null},
      () => this.searchBox && this.searchBox.focus());
  };

  onSelect = (e) => {
    const source = e.target.value;
    if (source === 'lists') { this.openPanel(); return; }
    this.setState({open: false, error: null});
    this.props.onChange({source, lists: []});
  };

  toggle = (id) => {
    const picked = this.state.picked.indexOf(id) === -1 ? this.state.picked.concat([id]) : this.state.picked.filter(x => x !== id);
    this.setState({picked, error: null});
  };

  apply = () => {
    if (!this.state.picked.length) { this.setState({error: 'Pick at least one List.'}); return; }
    this.setState({open: false});
    this.props.onChange({source: 'lists', lists: this.state.picked.slice()});
    this.selectBox && this.selectBox.focus();
  };

  cancel = () => { this.setState({open: false, error: null}); this.selectBox && this.selectBox.focus(); };

  names = () => {
    const all = this.state.lists ? this.state.lists.own.concat(this.state.lists.shared) : [];
    return (this.props.value.lists || []).map(id => { const l = all.find(x => x.id === id); return l ? l.name : `List ${id}`; });
  };

  renderGroup(title, items, shared) {
    const f = this.state.filter.trim().toLowerCase();
    const shown = items.filter(l => !f || l.name.toLowerCase().indexOf(f) !== -1 || (shared && l.owner.toLowerCase().indexOf(f) !== -1));
    return (
      <fieldset>
        <legend>{title}</legend>
        {!items.length && <div className="small" style={{opacity: .7}}>{shared ? 'No Lists are shared with you.' : 'You have no Lists yet.'}</div>}
        {items.length > 0 && !shown.length && <div className="small" style={{opacity: .7}}>No match.</div>}
        {shown.map(l => (
          <label key={l.id} className="cs-item">
            <input type="checkbox" checked={this.state.picked.indexOf(l.id) !== -1} onChange={() => this.toggle(l.id)} />
            <span>{l.name}{shared ? <span className="cs-meta"> · {l.owner}</span> : null}</span>
            <span className="cs-meta">{l.cards} card{l.cards === 1 ? '' : 's'}</span>
          </label>
        ))}
      </fieldset>
    );
  }

  render() {
    const {value, listsUrl, idPrefix} = this.props;
    const id = `${idPrefix || 'cs'}-source`;
    const light = Cookies.get('totheme') === 'light' || Cookies.get('totheme') === 'classic';
    const selectValue = this.state.open ? 'lists' : value.source;
    return (
      <div className="card-source" style={{position: 'relative'}}>
        <style>{PANEL_CSS}</style>
        <label htmlFor={id}>Cards from</label>
        <select id={id} className="form-control input-sm" value={selectValue} onChange={this.onSelect}
                ref={el => { this.selectBox = el }}>
          <option value="all">All cards</option>
          <option value="inv">My inventory</option>
          <option value="lists" disabled={!listsUrl}>Lists…</option>
        </select>
        {value.source === 'lists' && !this.state.open &&
          <span className="card-source-summary">
            {this.names().join(', ')}{' '}
            <button type="button" className="btn btn-link" onClick={this.openPanel}
                    aria-label="Change which Lists to search">Change</button>
          </span>}
        {this.state.open &&
          <div className={'card-source-panel' + (light ? ' light' : '')} role="dialog" aria-label="Pick Lists to search">
            <input type="search" className="form-control input-sm cs-search" placeholder="Filter Lists"
                   aria-label="Filter Lists" value={this.state.filter}
                   onChange={e => this.setState({filter: e.target.value})} ref={el => { this.searchBox = el }} />
            <div className="cs-groups">
              {this.state.loading && <div className="small">Loading your Lists…</div>}
              {this.state.loadError && <div className="cs-error" role="alert">{this.state.loadError}</div>}
              {this.state.lists && this.renderGroup('My Lists', this.state.lists.own, false)}
              {this.state.lists && this.renderGroup('Shared with me', this.state.lists.shared, true)}
            </div>
            <div className="cs-actions">
              {this.state.error && <span className="cs-error" role="alert">{this.state.error}</span>}
              <button type="button" className="btn btn-default btn-sm" onClick={this.cancel}>Cancel</button>
              <button type="button" className="btn btn-primary btn-sm" onClick={this.apply}>
                {this.state.picked.length ? `Search ${this.state.picked.length} List${this.state.picked.length === 1 ? '' : 's'}` : 'Search Lists'}
              </button>
            </div>
          </div>}
      </div>
    );
  }
}
