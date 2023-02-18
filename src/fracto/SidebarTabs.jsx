import React, {Component} from 'react';
import PropTypes from 'prop-types';
// import styled from "styled-components";

import {CoolTabs} from 'common/ui/CoolImports';
import SidebarLevels from './sidebar/SidebarLevels';

export const SIDEBAR_TAB_LABELS = ["levels", "jobs", "schedule", "history"]

export class SidebarTabs extends Component {

   static propTypes = {
      width_px: PropTypes.number.isRequired,
      tab_index: PropTypes.number.isRequired,
      on_tab_select: PropTypes.func.isRequired,
      item_specifier: PropTypes.string.isRequired,
      on_item_specify: PropTypes.func.isRequired,
   }

   state = {};

   tab_content = () => {
      const {tab_index, item_specifier, on_item_specify} = this.props;
      const {width_px} = this.props;
      switch (SIDEBAR_TAB_LABELS[tab_index]) {
         case "levels":
            return [
               <SidebarLevels
                  key={"SidebarTabs-SidebarLevels"}
                  width_px={width_px}
                  item_specifier={item_specifier}
                  on_item_specify={on_item_specify}
               />
            ];
         case "history":
            break;
         case "jobs":
            break;
         case "schedule":
            break;
         default:
            return [];
      }
      return [
         <div key={"tab_content_default"}>{`${SIDEBAR_TAB_LABELS[tab_index]} in tab_content`}</div>
      ];
   }

   render() {
      const {tab_index, on_tab_select} = this.props;
      const tabs_style = {
         backgroundColor: "#999999",
         height: "1.25rem",
      }
      const tab_content = this.tab_content();
      return <CoolTabs
         key={"SidebarTabs-CoolTabs"}
         style={tabs_style}
         labels={SIDEBAR_TAB_LABELS}
         tab_index={tab_index}
         selected_content={tab_content}
         on_tab_select={tab_index => on_tab_select(tab_index)}
      />
   }
}

export default SidebarTabs;
