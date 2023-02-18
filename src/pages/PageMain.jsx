import React, {Component} from 'react';
import PropTypes from 'prop-types';
// import styled from "styled-components";
//
// import {CoolStyles} from 'common/ui/CoolImports';

import AppPageMain from 'common/app/AppPageMain';

import SidebarTabs from 'fracto/SidebarTabs';
import MainFieldLevel from 'fracto/MainFieldLevel';

export class PageMain extends Component {

   static propTypes = {
      app_name: PropTypes.string.isRequired,
   }

   state = {
      left_width: 0,
      right_width: 0,
      tab_index: 0,
      item_specifier: "2"
   };

   componentDidMount() {
      const tab_index = localStorage.getItem("tab_index")
      const item_specifier = localStorage.getItem("item_specifier")
      this.setState({
         tab_index: tab_index !== null ? parseInt(tab_index) : 0,
         item_specifier: item_specifier ? item_specifier : "",
      })
   }

   on_resize = (left_width, right_width) => {
      this.setState({
         left_width: left_width,
         right_width: right_width
      })
   }

   on_tab_select = (tab_index) => {
      localStorage.setItem("tab_index", `${tab_index}`);
      this.setState({tab_index: tab_index})
   }

   on_item_specify = (item_specifier) => {
      localStorage.setItem("item_specifier", item_specifier);
      this.setState({item_specifier: item_specifier})
   }

   render_content_left = (width_px) => {
      const {tab_index, item_specifier} = this.state;
      return [
         <SidebarTabs
            key={"PageMain-SidebarTabs"}
            width_px={width_px}
            tab_index={tab_index}
            on_tab_select={tab_index => this.on_tab_select(tab_index)}
            item_specifier={item_specifier}
            on_item_specify={item_specifier => this.on_item_specify(item_specifier)}
         />
      ]
   }

   render_content_right = (width_px) => {
      const {item_specifier} = this.state
      return [
         <MainFieldLevel
            key={"PageMain-MainFieldLevel"}
            level_specifier={item_specifier}
            width_px={width_px}
         />
      ]
   }

   render() {
      const {left_width, right_width} = this.state;
      const {app_name} = this.props;
      const content_left = this.render_content_left(left_width);
      const content_right = this.render_content_right(right_width);
      return <AppPageMain
         app_name={app_name}
         on_resize={(left_width, right_width) => this.on_resize(left_width, right_width)}
         content_left={content_left}
         content_right={content_right}
      />
   }
}

export default PageMain;
