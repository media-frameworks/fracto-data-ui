import React from 'react';
import ReactDOM from 'react-dom';

import PageMain from "pages/PageMain";
import FractoIndexedTilesLoader from "./fracto/common/data/FractoIndexedTilesLoader";

const APP_NAME = 'fracto-data'
const page_main = <PageMain app_name={APP_NAME}/>

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
   <FractoIndexedTilesLoader
      app_name={APP_NAME}
      app_page={[page_main]}
   />
);
