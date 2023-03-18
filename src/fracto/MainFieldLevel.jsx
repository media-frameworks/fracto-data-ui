import {Component} from 'react';
import PropTypes from 'prop-types';
import styled from "styled-components";

import {CoolStyles} from 'common/ui/CoolImports';
import LevelHeader, {
   TILE_ACTION_CLASSIFY,
   TILE_ACTION_EDGE,
   TILE_ACTION_FILLS,
   TILE_ACTION_GENERATE,
   TILE_ACTION_INDEX,
   TILE_ACTION_INSPECT,
   TILE_ACTION_META,
   TILE_ACTION_STATS,
} from './mainfield/LevelHeader';

import FieldClassify from './mainfield/FieldClassify';
import FieldEdge from './mainfield/FieldEdge';
import FieldFills from './mainfield/FieldFills';
import FieldGenerate from './mainfield/FieldGenerate';
import FieldIndex from './mainfield/FieldIndex';
import FieldInspect from './mainfield/FieldInspect';
import FieldMeta from './mainfield/FieldMeta';
import FieldStats from './mainfield/FieldStats';

const LevelField = styled(CoolStyles.Block)`
   ${CoolStyles.fixed}
   top: 76px;
   right: 0;
   bottom: 0;
   overflow: auto;
   background-color: white;
}`

export class MainFieldLevel extends Component {

   static propTypes = {
      level_specifier: PropTypes.string.isRequired,
      on_item_specify: PropTypes.func.isRequired,
      width_px: PropTypes.number.isRequired,
   }

   state = {};

   render_field = () => {
      const {width_px, level_specifier} = this.props;
      const {level, tab} = LevelHeader.decode_specifier(level_specifier)
      if (!tab) {
         console.log("no tab specified");
         return [];
      }
      switch (tab) {
         case TILE_ACTION_CLASSIFY:
            return <FieldClassify level={level} width_px={width_px} />
         case TILE_ACTION_EDGE:
            return <FieldEdge level={level} width_px={width_px} />
         case TILE_ACTION_FILLS:
            return <FieldFills level={level} width_px={width_px} />
         case TILE_ACTION_GENERATE:
            return <FieldGenerate level={level} width_px={width_px} />
         case TILE_ACTION_INDEX:
            return <FieldIndex level={level} width_px={width_px} />
         case TILE_ACTION_INSPECT:
            return <FieldInspect level={level} width_px={width_px} />
         case TILE_ACTION_META:
            return <FieldMeta level={level} width_px={width_px} />
         case TILE_ACTION_STATS:
            return <FieldStats level={level} width_px={width_px} />
         default:
            console.log("unknown tab", tab)
            break;
      }
      return []
   }

   render() {
      const {level_specifier, on_item_specify, width_px} = this.props;
      const field_rendering = this.render_field()
      const field_style = {width: `${width_px}px`}
      return [
         <LevelHeader
            key={'LevelHeader'}
            level_specifier={level_specifier}
            on_item_specify={on_item_specify}
            width_px={width_px}/>,
         <LevelField
            key={'LevelField'}
            style={field_style}>
            {field_rendering}
         </LevelField>
      ];
   }
}

export default MainFieldLevel;
