import React from 'react';
import ReactDOM from 'react-dom';
import CollectionTableApp from '../../collection-table/js/collection_table';
import 'react-select/dist/react-select.css';


const ACCESS_TOKEN = window.django.access_token;


class MobileInvApp extends CollectionTableApp {
  getHeaders = () => {
    return {'Authorization': 'Bearer ' + ACCESS_TOKEN}
  }
}


ReactDOM.render(<MobileInvApp />,
  document.getElementById('mobile-inv-root'));
