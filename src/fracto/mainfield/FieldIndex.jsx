import {Component} from 'react';
import PropTypes from 'prop-types';
import styled from "styled-components";

import {CoolStyles} from 'common/ui/CoolImports';

import FractoCommon from "../common/FractoCommon";
import FractoDataLoader from "../common/data/FractoDataLoader";
import FractoData, {BIN_VERB_COMPLETED, BIN_VERB_INDEXED} from "../common/data/FractoData";
import FractoTileAutomate, {CONTEXT_SIZE_PX, TILE_SIZE_PX} from "../common/tile/FractoTileAutomate";
import FractoTileDetails from "../common/tile/FractoTileDetails";
import FractoUtil from "../common/FractoUtil";
import FractoMruCache from "../common/data/FractoMruCache";

const WRAPPER_MARGIN_PX = 25

const FieldWrapper = styled(CoolStyles.Block)`
   margin: ${WRAPPER_MARGIN_PX}px;
`;

const DetailsWrapper = styled(CoolStyles.InlineBlock)`
   margin: 0;
`;

const AutomateWrapper = styled(CoolStyles.InlineBlock)`
   width: ${CONTEXT_SIZE_PX + TILE_SIZE_PX + 20}px;
`;

const RecentResult = styled(CoolStyles.Block)`
   margin: 1rem;
`;

export class FieldIndex extends Component {

   static propTypes = {
      level: PropTypes.number.isRequired,
      width_px: PropTypes.number.isRequired,
   }

   state = {
      completed_tiles: [],
      tile_index: 0,
      loading: true,
      indexed_loading: true,
      most_recent_result: ''
   };

   componentDidMount() {
      const {level} = this.props;

      FractoDataLoader.load_tile_set_async(BIN_VERB_INDEXED, result => {
         console.log("FractoDataLoader.load_tile_set_async", BIN_VERB_INDEXED, result)
         FractoData.get_cached_tiles(level, BIN_VERB_INDEXED)
         FractoData.get_cached_tiles(level - 1, BIN_VERB_INDEXED)
         FractoData.get_cached_tiles(level - 2, BIN_VERB_INDEXED)
         FractoData.get_cached_tiles(level - 3, BIN_VERB_INDEXED)
         FractoData.get_cached_tiles(level - 4, BIN_VERB_INDEXED)
         this.setState({
            indexed_loading: false,
         });
      });
      FractoDataLoader.load_tile_set_async(BIN_VERB_COMPLETED, result => {
         console.log("FractoDataLoader.load_tile_set_async", BIN_VERB_COMPLETED, result)
         const completed_tiles = FractoData.get_cached_tiles(level, BIN_VERB_COMPLETED)
         const tile_index = parseInt(localStorage.getItem(`index_tile_index_${level}`))
         this.setState({
            completed_tiles: completed_tiles,
            tile_index: tile_index ? tile_index : 0,
            loading: false
         });
      });
   }

   on_tile_select = (tile_index) => {
      const {completed_tiles} = this.state;
      const {level} = this.props
      if (tile_index >= completed_tiles.length) {
         return;
      }
      this.setState({tile_index: tile_index})
      localStorage.setItem(`index_tile_index_${level}`, tile_index)
      const tile = completed_tiles[tile_index]
   }

   move_tile = (short_code, from, to, cb) => {
      FractoUtil.tile_to_bin(short_code, from, to, result => {
         console.log("FractoUtil.tile_to_bin", short_code, from, to, result);
         cb(result.result)
      })
   }

   test_edge_case = (tile, tile_data) => {
      if (tile.bounds.bottom === 0) {
         console.log("will not edge bottom tile");
         return false
      }
      const level = tile.short_code.length
      for (let img_x = 0; img_x < 256; img_x++) {
         for (let img_y = 0; img_y < 256; img_y++) {
            const [pattern, iterations] = tile_data[img_x][img_y];
            if (iterations > 2 * level) {
               console.log("not on edge");
               return false;
            }
         }
      }
      return true
   }

   empty_tile = (short_code, cb) => {
      FractoUtil.empty_tile(short_code, result => {
         console.log("FractoUtil.empty_tile", short_code, result);
         cb(result)
      })
   }

   index_tile = (tile, cb) => {
      FractoMruCache.get_tile_data(tile.short_code, data => {
         const is_edge = this.test_edge_case(tile, data)
         if (is_edge) {
            this.empty_tile(tile.short_code, result => {
               const tiles_to_empty = result ? result.all_descendants.length : 0;
               const result_text = (`emptied ${tiles_to_empty} tiles on edge`)
               this.setState({most_recent_result: result_text})
               cb(result_text)
            })
         } else {
            this.move_tile(tile.short_code, "complete", "indexed", result => {
               this.setState({most_recent_result: result})
               cb(result)
            })
         }
      })

   }

   render() {
      const {loading, indexed_loading, completed_tiles, tile_index, most_recent_result} = this.state
      const {level, width_px} = this.props
      if (loading || indexed_loading) {
         return FractoCommon.loading_wait_notice()
      }
      const details_width = width_px - (CONTEXT_SIZE_PX + TILE_SIZE_PX) - 40 - 2 * WRAPPER_MARGIN_PX;
      const details_style = {
         width: `${details_width}px`
      }
      const active_tile = tile_index >= completed_tiles.length ? {} : completed_tiles[tile_index]
      return <FieldWrapper>
         <AutomateWrapper>
            <FractoTileAutomate
               all_tiles={completed_tiles}
               tile_index={tile_index}
               level={level - 1}
               tile_action={this.index_tile}
               on_tile_select={this.on_tile_select}
            />
         </AutomateWrapper>
         <DetailsWrapper style={details_style}>
            <FractoTileDetails
               active_tile={active_tile}
               width_px={details_width}
            />
            <RecentResult>{most_recent_result}</RecentResult>
         </DetailsWrapper>
      </FieldWrapper>
   }
}

export default FieldIndex;
