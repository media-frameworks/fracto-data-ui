import {Component} from 'react';
import PropTypes from 'prop-types';
import styled from "styled-components";

import {CoolStyles} from 'common/ui/CoolImports';
import FractoData from 'fracto/common/data/FractoData';
import FractoUtil from "fracto/common/FractoUtil";

const MAX_LEVEL = 20;
const INDEX_WIDTH_PX = 50;

const LevelsWraper = styled(CoolStyles.Block)`
   height: auto;
   background-color: #aaaaaa;
`;

const LevelRow = styled(CoolStyles.Block)`
   ${CoolStyles.pointer}
   ${CoolStyles.noselect}
   margin: 0;
   height: 2.25rem;
`;

const IndexWraper = styled(CoolStyles.InlineBlock)`
   ${CoolStyles.align_right}
   margin: 0;
   width: ${INDEX_WIDTH_PX}px;
`;

const LevelIndex = styled(CoolStyles.InlineBlock)`
   ${CoolStyles.monospace}
   ${CoolStyles.noselect}
   ${CoolStyles.bold}
   ${CoolStyles.narrow_border_radius}
   color: black;
   border: 0.125rem solid black;
   margin: 4px 4px 0 0;
   font-size: 28px;
   line-height: 25px;
   height: 24px;
`;

const ColorBarWrapper = styled(CoolStyles.InlineBlock)`
   ${CoolStyles.narrow_border_radius}
   border: 0.125rem solid black;
   margin-top: 0.25rem;   
`;

const ColorBar = styled(CoolStyles.InlineBlock)`
   height: 1.5rem;
`;

export class SidebarLevels extends Component {

   static propTypes = {
      width_px: PropTypes.number.isRequired,
      item_specifier: PropTypes.string.isRequired,
      on_item_specify: PropTypes.func.isRequired,
   }

   state = {
      loading: true
   };

   static bin_counts = {}

   componentDidMount() {
      const {loading} = this.state;
      if (!loading) {
         return;
      }
      FractoData.load_bin_counts_async(returns => {
         SidebarLevels.bin_counts = returns;
         this.setState({loading: false})
      });
   }

   static get_bin_count = (bin, level) => {
      if (SidebarLevels.bin_counts[bin] && Array.isArray(SidebarLevels.bin_counts[bin])) {
         return SidebarLevels.bin_counts[bin][level]
      }
      return 0;
   }

   render_colorbar = (level) => {
      const {width_px} = this.props;
      const complete_count = SidebarLevels.get_bin_count("complete", level);
      const empty_count = SidebarLevels.get_bin_count("empty", level)
      const error_count = SidebarLevels.get_bin_count("error", level)
      const indexed_count = SidebarLevels.get_bin_count("indexed", level)
      const inland_count = SidebarLevels.get_bin_count("inland", level)
      const new_count = SidebarLevels.get_bin_count("new", level)
      const ready_count = SidebarLevels.get_bin_count("ready", level)
      const total = complete_count + empty_count + error_count + indexed_count + inland_count + new_count + ready_count;
      const bar_width_px = width_px - INDEX_WIDTH_PX - 12;
      const base_data = [
         {
            tooltip: `indexed : ${indexed_count}/${total} tiles`,
            width_px: (indexed_count * bar_width_px) / total,
            color: FractoUtil.fracto_pattern_color(3, 10000)
         },
         {
            tooltip: `complete : ${complete_count}/${total} tiles`,
            width_px: (complete_count * bar_width_px) / total,
            color: FractoUtil.fracto_pattern_color(5, 10000)
         },
         {
            tooltip: `ready : ${ready_count}/${total} tiles`,
            width_px: (ready_count * bar_width_px) / total,
            color: FractoUtil.fracto_pattern_color(9, 10000)
         },
         {
            tooltip: `inland : ${inland_count}/${total} tiles`,
            width_px: (inland_count * bar_width_px) / total,
            color: FractoUtil.fracto_pattern_color(17, 10000)
         },
         {
            tooltip: `new : ${new_count}/${total} tiles`,
            width_px: (new_count * bar_width_px) / total,
            color: FractoUtil.fracto_pattern_color(7, 10000)
         },
         {
            tooltip: `empty : ${empty_count}/${total} tiles`,
            width_px: (empty_count * bar_width_px) / total,
            color: FractoUtil.fracto_pattern_color(0, 10)
         },
         {
            tooltip: `error : ${error_count}/${total} tiles`,
            width_px: (error_count * bar_width_px) / total,
            color: FractoUtil.fracto_pattern_color(2, 10000)
         },
      ]
      return base_data.map((data, i) => {
         const style = {
            backgroundColor: data.color,
            width: `${data.width_px}px`
         };
         return <ColorBar
            key={`colorbar_${level}_${i}`}
            style={style}
            title={data.tooltip}
         />
      })

   }

   render() {
      const {loading} = this.state;
      const {item_specifier, on_item_specify} = this.props;
      const levels = new Array(MAX_LEVEL + 2).fill('')
      const selected_level = parseInt(item_specifier)
      const unselected_style = {
         backgroundColor: "#aaaaaa",
         color: "#eeeeee"
      }
      for (let i = 2; i <= MAX_LEVEL; i++) {
         const colorbar = this.render_colorbar(i)
         const is_selected = i === selected_level;
         levels[i] = <LevelRow
            style={{backgroundColor: is_selected ? "white" : '#aaaaaa'}}
            onClick={e => on_item_specify(`${i}`)}>
            <IndexWraper>
               <LevelIndex style={ is_selected? {} : unselected_style}>{i}</LevelIndex>
            </IndexWraper>
            <ColorBarWrapper style={{opacity: is_selected ? 1.0 : 0.5}}>
               {colorbar}
            </ColorBarWrapper>
         </LevelRow>
      }
      return loading ? 'loading...' : <LevelsWraper>
         {levels}
      </LevelsWraper>
   }
}

export default SidebarLevels;
