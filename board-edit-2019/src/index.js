import React from 'react';
import ReactDOM from 'react-dom';
import 'react-toggle/style.css';
import 'react-rangeslider/lib/index.css';
import 'react-select/dist/react-select.css';
import '../css/board-edit.scss';
import BoardsEditorApp from './js/BoardsEditorApp';


ReactDOM.render(<BoardsEditorApp />,
  document.getElementById('board-edit-root'));
