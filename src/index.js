import React from 'react';
import ReactDOM from 'react-dom';

import {GoogleOAuthProvider} from '@react-oauth/google';

import AppLoginPage from "common/app/AppLoginPage"
import google_clident_data from "admin/google_client_data.json"

ReactDOM.render(
   <GoogleOAuthProvider clientId={google_clident_data.web.client_id}>
      <React.StrictMode>
         <AppLoginPage app_name={"fracto-data"} />
      </React.StrictMode>
   </GoogleOAuthProvider>,
   document.getElementById('root')
);
