import {Component} from 'react';
import PropTypes from 'prop-types';
import styled from "styled-components";

import {CoolStyles} from 'common/ui/CoolImports';
import StoreS3 from 'common/system/StoreS3';

import FractoData, {BIN_VERB_INDEXED} from 'fracto/common/data/FractoData';
import FractoDataLoader from 'fracto/common/data/FractoDataLoader';
import FractoCommon from 'fracto/common/FractoCommon';

import FractoTileAutomate, {CONTEXT_SIZE_PX, TILE_SIZE_PX} from 'fracto/common/tile/FractoTileAutomate';
import FractoTileDetails from 'fracto/common/tile/FractoTileDetails';

const WRAPPER_MARGIN_PX = 25

const FieldWrapper = styled(CoolStyles.Block)`
   margin: ${WRAPPER_MARGIN_PX}px;
`;

const AutomateWrapper = styled(CoolStyles.InlineBlock)`
   width: ${CONTEXT_SIZE_PX + TILE_SIZE_PX + 20}px;
`;

export class FieldMeta extends Component {

   static propTypes = {
      level: PropTypes.number.isRequired,
      width_px: PropTypes.number.isRequired,
   }

   state = {
      loading: true,
      all_tiles: [],
      active_tile: null
   };

   componentDidMount() {
      const {level} = this.props;
      const previous_state = localStorage.getItem(`meta_state_${level}`)
      if (previous_state) {
         this.setState(JSON.parse(previous_state));
      }
      FractoDataLoader.load_tile_set_async(BIN_VERB_INDEXED, result => {
         console.log("FractoDataLoader.load_tile_set_async", BIN_VERB_INDEXED, result)
         const all_tiles = FractoData.get_cached_tiles(level, BIN_VERB_INDEXED)
         this.setState({
            loading: false,
            all_tiles: all_tiles,
            active_tile: all_tiles[0],
         });
      });
   }

   generate_tile_meta = (tile) => {

   }

   meta_tile = (tile, cb) => {
      this.setState({active_tile: tile})
      const meta_name = `tiles/256/meta/${tile.short_code}.json`;
      StoreS3.get_file_async(meta_name, "fracto", result => {
         console.log("StoreS3.get_file_async", meta_name, result)
         if (!result) {
            this.generate_tile_meta(tile)
         }
         cb(true);
      })
   }

   render() {
      const {loading, all_tiles, active_tile} = this.state;
      const {level, width_px} = this.props;
      if (loading) {
         return FractoCommon.loading_wait_notice()
      }
      if (!all_tiles.length) {
         return "no tiles"
      }
      if (!active_tile) {
         return "no tile"
      }
      return <FieldWrapper>
         <AutomateWrapper>
            <FractoTileAutomate
               all_tiles={all_tiles}
               level={level}
               tile_action={this.meta_tile}
               on_tile_select={active_tile => this.setState({active_tile: active_tile})}
            />
         </AutomateWrapper>
         <FractoTileDetails
            active_tile={active_tile}
            width_px={width_px - (CONTEXT_SIZE_PX + TILE_SIZE_PX) - 40 - 2 * WRAPPER_MARGIN_PX}
         />
      </FieldWrapper>
   }
}

export default FieldMeta;
