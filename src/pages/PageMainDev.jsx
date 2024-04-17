import React, {Component} from 'react';
import PropTypes from 'prop-types';
import styled from "styled-components";

import {CoolStyles} from 'common/ui/CoolImports';

import AppPageLayout from 'common/app/AppPageLayout';
import ColorBar from './sidebar/ColorBar';
import FieldGenerator from "./mainfield/FieldGenerator";
import FieldIndex from "./mainfield/FieldIndex";
import FieldClassify from "./mainfield/FieldClassify";
import FieldInventory from "./mainfield/FieldInventory";

const LEVEL_WIDTH_PX = 30;
const DOT_WIDTH_PX = 45;
const SELECTED_LEVEL_KEY = `main_page_selected_level`

const FIELD_TABS = [
   {
      name: "generate",
      render_fn: (width_px, level) => <FieldGenerator level={level} width_px={width_px}/>
   },
   {
      name: "index",
      render_fn: (width_px, level) => <FieldIndex level={level} width_px={width_px}/>
   },
   {
      name: "classify",
      render_fn: (width_px, level) => <FieldClassify level={level} width_px={width_px}/>
   },
   {
      name: "inventory",
      render_fn: (width_px, level) => <FieldInventory level={level} width_px={width_px}/>
   },
   {
      name: "stats",
      render_fn: (width_px, level) => "stats here"
   }
]

const ColorBarWrapper = styled(CoolStyles.InlineBlock)`
   ${CoolStyles.narrow_border_radius}
   margin-left: 5px;
   vertical-align: middle;
   border: 1px solid black;
`

const IndexWraper = styled(CoolStyles.InlineBlock)`
   ${CoolStyles.align_center}
   vertical-align: middle;
   margin: 0;
`;

const LevelIndex = styled(CoolStyles.InlineBlock)`
   ${CoolStyles.monospace}
   ${CoolStyles.noselect}
   ${CoolStyles.bold}
   ${CoolStyles.narrow_border_radius}
   color: black;
   border: 1px solid black;
   margin: 1px;
   background-color: white;
   width: ${LEVEL_WIDTH_PX}px;
   font-size: 1.25rem;
`;

export class PageMainDev extends Component {

   static propTypes = {
      app_name: PropTypes.string.isRequired,
   }

   state = {
      left_width: 500,
      right_width: 0,
      selected_level: 0
   }

   componentDidMount() {
      const selected_level_str = localStorage.getItem(SELECTED_LEVEL_KEY)
      if (selected_level_str) {
         this.setState({selected_level: parseInt(selected_level_str)})
      }
   }

   on_resized = (left_width, right_width) => {
      this.setState({
         left_width: left_width,
         right_width: right_width
      })
   }

   on_selected = (selected_level) => {
      this.setState({selected_level: selected_level})
      localStorage.setItem(SELECTED_LEVEL_KEY, `${selected_level}`)
   }

   render() {
      const {left_width, selected_level} = this.state
      const {app_name} = this.props;
      const all_levels = []
      for (let level = 3; level < 35; level++) {
         all_levels.push(level)
      }
      console.log("left_width", left_width)
      const fields_list = all_levels.map((level, i) => {
         const style = selected_level === i ? {} : {opacity: 0.75}
         return {
            name: [
               <IndexWraper><LevelIndex>{level}</LevelIndex></IndexWraper>,
               <ColorBarWrapper style={style}>
                  <ColorBar
                     width_px={left_width - LEVEL_WIDTH_PX - DOT_WIDTH_PX}
                     level={level}
                     selected={selected_level === i}
                  />
               </ColorBarWrapper>
            ],
            field_title: `Level ${level}`,
            field_indicator: level
            // field_renderer: width_px => <FieldProjects width_px={width_px}/>,
            // sidebar_list_fn: FieldProjects.get_sidebar_list
         }
      })
      return <AppPageLayout
         app_fields_list={fields_list}
         app_name={app_name}
         selected_field_index={selected_level}
         app_field_tabs={FIELD_TABS}
         on_resized={this.on_resized}
         on_selected={this.on_selected}
      />
   }
}

export default PageMainDev;
