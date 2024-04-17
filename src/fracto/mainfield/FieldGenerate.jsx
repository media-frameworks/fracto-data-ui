import {Component} from 'react';
import PropTypes from 'prop-types';
import styled from "styled-components";

import {CoolStyles} from 'common/ui/CoolImports';

import FractoCommon from "fracto/common/FractoCommon";

import FractoDataLoader from "fracto/common/data/FractoDataLoader";
import FractoData, {
   BIN_VERB_INDEXED,
   BIN_VERB_INLAND,
   BIN_VERB_READY
} from "fracto/common/data/FractoData";

import FractoTileAutomate, {
   CONTEXT_SIZE_PX,
   TILE_SIZE_PX
} from "fracto/common/tile/FractoTileAutomate";
import FractoTileGenerate from "fracto/common/tile/FractoTileGenerate"
import FractoTileDetails from "fracto/common/tile/FractoTileDetails";

const WRAPPER_MARGIN_PX = 25

const FieldWrapper = styled(CoolStyles.Block)`
   margin: ${WRAPPER_MARGIN_PX}px;
`;

const AutomateWrapper = styled(CoolStyles.InlineBlock)`
   width: ${CONTEXT_SIZE_PX + TILE_SIZE_PX + 20}px;
`;

export class FieldGenerate extends Component {

   static propTypes = {
      level: PropTypes.number.isRequired,
      width_px: PropTypes.number.isRequired,
   }

   state = {
      ready_tiles_loaded: false,
      inland_tiles_loaded: false,
      indexed_tiles_loaded: false,
      ready_tiles: [],
      inland_tiles: [],
      tile_index: -1,
      status_text: '',
      meta_data: {}
   };

   componentDidMount() {
      const {level} = this.props;
      const index_key = `generate-${level}-index`
      const tile_index = parseInt(localStorage.getItem(index_key))
      console.log("tile_index",index_key, tile_index)
      FractoDataLoader.load_tile_set_async(BIN_VERB_READY, result => {
         console.log("FractoDataLoader.load_tile_set_async", BIN_VERB_READY, result)
         const ready_tiles = FractoData.get_cached_tiles(level, BIN_VERB_READY)
         this.setState({
            ready_tiles: ready_tiles,
            ready_tiles_loaded: true,
            tile_index: tile_index ? tile_index : 0,
         });
      });
      FractoDataLoader.load_tile_set_async(BIN_VERB_INLAND, result => {
         console.log("FractoDataLoader.load_tile_set_async", BIN_VERB_INLAND, result)
         const inland_tiles = FractoData.get_cached_tiles(level, BIN_VERB_INLAND)
         console.log("inland tiles count", inland_tiles.length)
         this.setState({
            inland_tiles: inland_tiles,
            inland_tiles_loaded: true
         });
      });
      FractoDataLoader.load_tile_set_async(BIN_VERB_INDEXED, result => {
         console.log("FractoDataLoader.load_tile_set_async", BIN_VERB_INDEXED, result)
         FractoData.get_cached_tiles(level, BIN_VERB_INDEXED)
         FractoData.get_cached_tiles(level - 1, BIN_VERB_INDEXED)
         FractoData.get_cached_tiles(level - 2, BIN_VERB_INDEXED)
         FractoData.get_cached_tiles(level - 3, BIN_VERB_INDEXED)
         FractoData.get_cached_tiles(level - 4, BIN_VERB_INDEXED)
         this.setState({
            indexed_tiles_loaded: true,
         });
      });
   }

   componentDidUpdate(prevProps: Readonly<P>, prevState: Readonly<S>, snapshot: SS) {
      const {level} = this.props;
      if (this.props.level === prevProps.level) {
         return;
      }
      const inland_tiles = FractoData.get_cached_tiles(level, BIN_VERB_INLAND)
      const ready_tiles = FractoData.get_cached_tiles(level, BIN_VERB_READY)
      console.log("updating tiles for level", level)
      this.setState({
         inland_tiles: inland_tiles,
         ready_tiles: ready_tiles
      });
   }

   set_tile_index = (tile_index) => {
      const {level} = this.props;
      this.setState({tile_index: tile_index})
      const index_key = `generate-${level}-index`
      localStorage.setItem(index_key, `${tile_index}`)
   }

   render() {
      const {
         ready_tiles_loaded, inland_tiles_loaded, indexed_tiles_loaded,
         ready_tiles, inland_tiles, tile_index
      } = this.state;
      const {level, width_px} = this.props;
      if (!ready_tiles_loaded || !inland_tiles_loaded || !indexed_tiles_loaded) {
         return FractoCommon.loading_wait_notice()
      }
      const all_tiles = ready_tiles.concat(inland_tiles).sort((a, b) => {
         return a.bounds.left === b.bounds.left ?
            (a.bounds.top > b.bounds.top ? -1 : 1) :
            (a.bounds.left > b.bounds.left ? 1 : -1)
      })
      if (!all_tiles.length) {
         return "no tiles 3"
      }
      if (tile_index < 0) {
         return "no tile"
      }
      return <FieldWrapper>
         <AutomateWrapper>
            <FractoTileAutomate
               all_tiles={all_tiles}
               tile_index={tile_index}
               level={level - 2}
               tile_action={FractoTileGenerate.generate_tile}
               on_tile_select={tile_index => this.set_tile_index(tile_index)}
               no_tile_mode={true}
            />
         </AutomateWrapper>
         <FractoTileDetails
            active_tile={all_tiles[tile_index]}
            width_px={width_px - (CONTEXT_SIZE_PX + TILE_SIZE_PX) - 40 - 2 * WRAPPER_MARGIN_PX}
         />
      </FieldWrapper>
   }
}

export default FieldGenerate;
