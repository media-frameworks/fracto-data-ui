import {Component} from 'react';
import PropTypes from 'prop-types';
import styled from "styled-components";

import {CoolStyles} from 'common/ui/CoolImports';
import FractoData from 'fracto/common/data/FractoData';
import FractoUtil from "fracto/common/FractoUtil";

var BIN_COUNTS = {}
const ROW_HEIGHT_PX = 24;

export const get_bin_count = (bin, level) => {
   if (BIN_COUNTS[bin] && Array.isArray(BIN_COUNTS[bin])) {
      return BIN_COUNTS[bin][level]
   }
   return 0;
}

const ColorBarSegment = styled(CoolStyles.InlineBlock)`
   height: ${ROW_HEIGHT_PX}px;
`;

export class ColorBar extends Component {

   static propTypes = {
      width_px: PropTypes.number.isRequired,
      level: PropTypes.number.isRequired,
      selected: PropTypes.bool.isRequired,
   }

   state = {
      bin_counts: null
   }

   componentDidMount() {
      FractoData.load_bin_counts_async(returns => {
         BIN_COUNTS = returns;
         this.setState({bin_counts: returns})
      });
   }

   render = () => {
      const {bin_counts} = this.state
      if (!bin_counts) {
         return ''
      }
      const {width_px, level, selected} = this.props;
      const complete_count = get_bin_count("complete", level);
      const empty_count = 0; //get_bin_count("empty", level)
      const error_count = get_bin_count("error", level)
      const indexed_count = get_bin_count("indexed", level)
      const inland_count = get_bin_count("inland", level)
      const new_count = get_bin_count("new", level)
      const ready_count = get_bin_count("ready", level)
      const total = complete_count + empty_count + error_count + indexed_count + inland_count + new_count + ready_count;
      const iterations = selected ? 10000 : 10
      const base_data = [
         {
            tooltip: `indexed : ${indexed_count}/${total} tiles`,
            width_px: (indexed_count * width_px) / total,
            color: FractoUtil.fracto_pattern_color(3, iterations)
         },
         {
            tooltip: `complete : ${complete_count}/${total} tiles`,
            width_px: (complete_count * width_px) / total,
            color: FractoUtil.fracto_pattern_color(5, iterations)
         },
         {
            tooltip: `ready : ${ready_count}/${total} tiles`,
            width_px: (ready_count * width_px) / total,
            color: FractoUtil.fracto_pattern_color(9, iterations)
         },
         {
            tooltip: `inland : ${inland_count}/${total} tiles`,
            width_px: (inland_count * width_px) / total,
            color: FractoUtil.fracto_pattern_color(17, iterations)
         },
         {
            tooltip: `new : ${new_count}/${total} tiles`,
            width_px: (new_count * width_px) / total,
            color: FractoUtil.fracto_pattern_color(7, iterations)
         },
         // {
         //    tooltip: `empty : ${empty_count}/${total} tiles`,
         //    width_px: (empty_count * width_px) / total,
         //    color: FractoUtil.fracto_pattern_color(0, 10)
         // },
         {
            tooltip: `error : ${error_count}/${total} tiles`,
            width_px: (error_count * width_px) / total,
            color: FractoUtil.fracto_pattern_color(2, iterations)
         },
      ]
      return base_data.map((data, i) => {
         const style = {
            backgroundColor: data.color,
            width: `${data.width_px}px`
         };
         return <ColorBarSegment
            key={`colorbar_${level}_${i}`}
            style={style}
            title={data.tooltip}
         />
      })

   }
}

export default ColorBar
