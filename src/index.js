import React from 'react';
import ReactDOM from 'react-dom';
import PageMain from "pages/PageMain"
import PageMainDev from "pages/PageMainDev"

console.log("process.env", process.env)

try{
   const page_main = process.env.REACT_APP_DEV ? <PageMainDev app_name={"fracto-data-dev"}/> : <PageMain app_name={"fracto-data"}/>
   ReactDOM.render(
      <React.StrictMode>
         {page_main}
      </React.StrictMode>,
      document.getElementById('root')
   );
} catch (e) {
   console.log(`error: ${e.message}`);
   console.log(`stack: ${e.stack}`);
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
