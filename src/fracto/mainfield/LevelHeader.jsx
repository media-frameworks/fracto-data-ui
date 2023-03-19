import {Component} from 'react';
import PropTypes from 'prop-types';
import styled from "styled-components";

import {CoolStyles} from 'common/ui/CoolImports';
import {SidebarLevels} from 'fracto/sidebar/SidebarLevels';
import FractoUtil from "fracto/common/FractoUtil";

export const TILE_ACTION_CLASSIFY = "classify";
export const TILE_ACTION_EDGE = "edge";
export const TILE_ACTION_FILLS = "fills";
export const TILE_ACTION_GENERATE = "generate";
export const TILE_ACTION_INDEX = "index";
export const TILE_ACTION_INSPECT = "inspect";
export const TILE_ACTION_META = "meta";
export const TILE_ACTION_STATS = "stats";

const BUTTON_LABELS = [
   TILE_ACTION_CLASSIFY,
   TILE_ACTION_EDGE,
   TILE_ACTION_FILLS,
   TILE_ACTION_GENERATE,
   TILE_ACTION_INDEX,
   TILE_ACTION_INSPECT,
   TILE_ACTION_META,
   TILE_ACTION_STATS,
]

const TitleBar = styled(CoolStyles.Block)`
   background: linear-gradient(120deg, white, #999999);
   height: 72px;
   width: 100%;
   overflow-x: noscroll;
`;

const LevelTitle = styled(CoolStyles.InlineBlock)`
   ${CoolStyles.uppercase}
   ${CoolStyles.bold}
   ${CoolStyles.align_center}
   letter-spacing: 0.25rem;
   font-size: 1.75rem;
   line-height: 46px;
   padding: 0.25rem 0.5rem;
   background-color: white;
   height: 46px;
`;

const TotalStat = styled(CoolStyles.InlineBlock)`
   ${CoolStyles.italic}
   ${CoolStyles.align_middle}
   color: #55555;
   margin-left: 0.25rem;
   font-size: 0.9rem;
   line-height: 1.5rem;
`;

const ColorBox = styled(CoolStyles.InlineBlock)`
   ${CoolStyles.narrow_border_radius}
   ${CoolStyles.narrow_text_shadow}
   ${CoolStyles.monospace}
   ${CoolStyles.bold}
   padding: 0.125rem 0.25rem 0;
   border: 0.1rem solid #555555;
   color: white;
   margin-left: 1rem;
   margin-top: 0.125rem;
   font-size: 1rem;
`;

const HeaderButton = styled(CoolStyles.InlineBlock)`
   ${CoolStyles.noselect}
   ${CoolStyles.uppercase}
   ${CoolStyles.align_center}
   ${CoolStyles.bold}
   ${CoolStyles.pointer}
   ${CoolStyles.ellipsis}
   color: #666666;
   letter-spacing: 0.125rem;
   font-size: 0.85rem;
   padding: 0.125rem 0.75rem 0;
   margin: 0.25rem 0 0 0.25rem;
   border: 0.125rem solid #666666;
   background-color: #bbbbbb;
`;

export class LevelHeader extends Component {

   static propTypes = {
      width_px: PropTypes.number.isRequired,
      level_specifier: PropTypes.string.isRequired,
      on_item_specify: PropTypes.func.isRequired,
   }

   state = {};

   render_stats_bar = (level) => {
      const complete_count = SidebarLevels.get_bin_count("complete", level);
      const empty_count = SidebarLevels.get_bin_count("empty", level)
      const error_count = SidebarLevels.get_bin_count("error", level)
      const indexed_count = SidebarLevels.get_bin_count("indexed", level)
      const inland_count = SidebarLevels.get_bin_count("inland", level)
      const new_count = SidebarLevels.get_bin_count("new", level)
      const ready_count = SidebarLevels.get_bin_count("ready", level)
      const total = complete_count + empty_count + error_count + indexed_count + inland_count + new_count + ready_count;

      let color_boxes = [];
      if (indexed_count) {
         const indexed_pct = Math.round(indexed_count * 1000 / total) / 10;
         color_boxes.push([
            <ColorBox
               title={`${indexed_count} to be exact`}
               style={{backgroundColor: FractoUtil.fracto_pattern_color(3, 1000)}}>
               {`${indexed_pct}%`}
            </ColorBox>,
            <TotalStat>indexed</TotalStat>
         ])
      }
      if (complete_count) {
         const complete_pct = Math.round(complete_count * 1000 / total) / 10;
         color_boxes.push([
            <ColorBox
               title={`${complete_count} to be exact`}
               style={{backgroundColor: FractoUtil.fracto_pattern_color(5, 1000)}}>
               {`${complete_pct}%`}
            </ColorBox>,
            <TotalStat>complete</TotalStat>
         ])
      }
      if (ready_count) {
         const ready_pct = Math.round(ready_count * 1000 / total) / 10;
         color_boxes.push([
            <ColorBox
               title={`${ready_count} to be exact`}
               style={{backgroundColor: FractoUtil.fracto_pattern_color(9, 100)}}>
               {`${ready_pct}%`}
            </ColorBox>,
            <TotalStat>ready</TotalStat>
         ])
      }
      if (inland_count) {
         const inland_pct = Math.round(inland_count * 1000 / total) / 10;
         color_boxes.push([
            <ColorBox
               title={`${inland_count} to be exact`}
               style={{backgroundColor: FractoUtil.fracto_pattern_color(17, 1000)}}>
               {`${inland_pct}%`}
            </ColorBox>,
            <TotalStat>inland</TotalStat>
         ])
      }
      if (new_count) {
         const new_pct = Math.round(new_count * 1000 / total) / 10;
         color_boxes.push([
            <ColorBox
               title={`${new_count} to be exact`}
               style={{backgroundColor: FractoUtil.fracto_pattern_color(7, 10000)}}>
               {`${new_pct}%`}
            </ColorBox>,
            <TotalStat>new</TotalStat>
         ])
      }
      if (empty_count) {
         const empty_pct = Math.round(empty_count * 1000 / total) / 10;
         color_boxes.push([
            <ColorBox
               title={`${empty_count} to be exact`}
               style={{backgroundColor: FractoUtil.fracto_pattern_color(0, 100)}}>
               {`${empty_pct}%`}
            </ColorBox>,
            <TotalStat>empty</TotalStat>
         ])
      }
      if (error_count) {
         const error_pct = Math.round(error_count * 1000 / total) / 10;
         color_boxes.push([
            <ColorBox
               title={`${error_count} to be exact`}
               style={{backgroundColor: FractoUtil.fracto_pattern_color(2, 1000)}}>
               {`${error_pct}%`}
            </ColorBox>,
            <TotalStat>error</TotalStat>
         ])
      }

      return <CoolStyles.Block>
         <TotalStat>{`${total} tiles total`}</TotalStat>
         {color_boxes}
      </CoolStyles.Block>
   }

   on_tab_select = (tab) => {
      const {level_specifier, on_item_specify} = this.props;
      const {level} = LevelHeader.decode_specifier(level_specifier)
      const new_specifier = LevelHeader.encode_specifier(level, tab)
      on_item_specify(new_specifier)
   }

   render_button_bar = (selected_tab) => {
      const {width_px} = this.props;
      const button_width = `${(width_px - 150) / 12}px`;
      const button_style = {width: button_width}
      const selected_style = {
         backgroundColor: "white",
         border: "0",
         height: "1.5rem",
         borderTopLeftRadius: "0.25rem",
         borderTopRightRadius: "0.25rem",
         textDecoration: "underline",
         width: button_width,
         fontSize: "1.125rem"
      }
      return BUTTON_LABELS.map(label => {
         return <HeaderButton
            onClick={e => this.on_tab_select(label)}
            style={label === selected_tab ? selected_style : button_style}>
            {label}
         </HeaderButton>
      })
   }

   static decode_specifier = (level_specifier) => {
      const level_parts = level_specifier.split('-');
      if (level_parts.length === 1) {
         return {level: parseInt(level_parts[0])}
      }
      if (level_parts.length === 2) {
         return {
            level: parseInt(level_parts[0]),
            tab: level_parts[1]
         }
      }
      return {};
   }

   static encode_specifier = (level, tab) => {
      return `${level}-${tab}`
   }

   render() {
      const {width_px, level_specifier} = this.props;
      const decoded = LevelHeader.decode_specifier(level_specifier)
      if (!decoded.level) {
         return "..."
      }
      // console.log("decoded", decoded)
      const stats_bar = this.render_stats_bar(decoded.level)
      const button_bar = this.render_button_bar(decoded.tab || "stats")
      const title_style = {width: width_px < 1500 ? "40px" : `${width_px / 10}px`}
      return [
         <TitleBar>
            <LevelTitle style={title_style}>{width_px < 1500 ? decoded.level : `Level ${decoded.level}`}</LevelTitle>
            <CoolStyles.InlineBlock>
               {stats_bar}
               {button_bar}
            </CoolStyles.InlineBlock>
         </TitleBar>
      ];
   }
}

export default LevelHeader;
