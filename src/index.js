import React from 'react';
import ReactDOM from 'react-dom';
// import {GoogleOAuthProvider} from '@react-oauth/google';
// import AppLoginPage from "common/app/AppLoginPage"
// import google_clident_data from "admin/google_client_data.json"
import PageMain from "pages/PageMain"

try{
   ReactDOM.render(
      // <GoogleOAuthProvider clientId={google_clident_data.web.client_id}>
      <React.StrictMode>
         <PageMain app_name={"fracto-data"}/>
      </React.StrictMode>,
      // </GoogleOAuthProvider>,
      document.getElementById('root')
   );
} catch {
   debugger;
}

window.onerror = (a, b, c, d, e) => {
   console.log(`message: ${a}`);
   console.log(`source: ${b}`);
   console.log(`lineno: ${c}`);
   console.log(`colno: ${d}`);
   console.log(`error: ${e}`);

   debugger;
   return true;
};
