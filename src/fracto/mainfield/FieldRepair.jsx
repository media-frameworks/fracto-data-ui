import {Component} from 'react';
import PropTypes from 'prop-types';
import styled from "styled-components";

import {CoolStyles} from 'common/ui/CoolImports';

import FractoDataLoader from "../common/data/FractoDataLoader";
import FractoData, {BIN_VERB_ERROR} from "../common/data/FractoData";
import FractoCommon from "../common/FractoCommon";
import FractoTileAutomate, {CONTEXT_SIZE_PX, TILE_SIZE_PX} from "../common/tile/FractoTileAutomate";
import FractoTileDetails from "../common/tile/FractoTileDetails";

const WRAPPER_MARGIN_PX = 25

const FieldWrapper = styled(CoolStyles.Block)`
   margin: ${WRAPPER_MARGIN_PX}px;
`;

const DetailsWrapper = styled(CoolStyles.InlineBlock)`
   margin: 0;
`;

const StatusTextWrapper = styled(CoolStyles.Block)`
   ${CoolStyles.uppercase};
   ${CoolStyles.bold};
   ${CoolStyles.underline};
   font-size: 0.85;
   letter-spacing: 0.125rem;
   margin-bottom: 0.5rem;
`;

const AutomateWrapper = styled(CoolStyles.InlineBlock)`
   width: ${CONTEXT_SIZE_PX + TILE_SIZE_PX + 20}px;
`;

export class FieldRepair extends Component {

   static propTypes = {
      level: PropTypes.number.isRequired,
      width_px: PropTypes.number.isRequired,
   }

   state = {
      error_tiles: [],
      tile_index: -1,
      status_text: '',
   };

   componentDidMount() {
      const {level} = this.props;
      FractoDataLoader.load_tile_set_async(BIN_VERB_ERROR, result => {
         console.log("FractoDataLoader.load_tile_set_async", BIN_VERB_ERROR, result)
         const error_tiles = FractoData.get_cached_tiles(level, BIN_VERB_ERROR)
         this.setState({
            error_tiles: error_tiles,
            tile_index: 0
         });
         // this.load_tile_error(error_tiles[0], error_data => {
         //    console.log("load_tile_error", error_data)
         // })
      });
   }

   on_tile_select = (tile_index) => {
      const {error_tiles} = this.state;
      if (tile_index >= error_tiles.length) {
         return;
      }
      console.log("on_tile_select", error_tiles[tile_index])
      this.setState({tile_index: tile_index})
   }

   repair_tile = (tile, cb) => {
      console.log("repair_tile", tile)
      cb(true)
   }

   render() {
      const {error_tiles, tile_index, status_text} = this.state;
      const {level, width_px} = this.props;
      if (!error_tiles.length) {
         return FractoCommon.loading_wait_notice()
      }
      const details_width = width_px - (CONTEXT_SIZE_PX + TILE_SIZE_PX) - 40 - 2 * WRAPPER_MARGIN_PX;
      const details_style = {
         width: `${details_width}px`
      }
      const active_tile = tile_index >= error_tiles.length ? {} : error_tiles[tile_index]
      return <FieldWrapper>
         <AutomateWrapper>
            <FractoTileAutomate
               all_tiles={error_tiles}
               tile_index={tile_index}
               level={level - 1}
               tile_action={this.repair_tile}
               on_tile_select={this.on_tile_select}
            />
         </AutomateWrapper>
         <DetailsWrapper style={details_style}>
            <FractoTileDetails
               active_tile={active_tile}
               width_px={details_width}
            />
            <StatusTextWrapper>{status_text}</StatusTextWrapper>
         </DetailsWrapper>
      </FieldWrapper>
   }
}

export default FieldRepair;
