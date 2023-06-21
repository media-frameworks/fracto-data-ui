import {Component} from 'react';
import PropTypes from 'prop-types';
import styled from "styled-components";

import {CoolStyles} from 'common/ui/CoolImports';

import FractoData, {
   BIN_VERB_INDEXED,
   BIN_VERB_COMPLETED,
   BIN_VERB_POTENTIALS,
} from 'fracto/common/data/FractoData';
import FractoDataLoader from 'fracto/common/data/FractoDataLoader';
import FractoCommon from 'fracto/common/FractoCommon';
import FractoUtil from 'fracto/common/FractoUtil';

import FractoTileAutomate, {CONTEXT_SIZE_PX, TILE_SIZE_PX} from 'fracto/common/tile/FractoTileAutomate';
import FractoTileDetails from 'fracto/common/tile/FractoTileDetails';
import FractoMruCache from "../common/data/FractoMruCache";

const WRAPPER_MARGIN_PX = 25

const FieldWrapper = styled(CoolStyles.Block)`
   margin: ${WRAPPER_MARGIN_PX}px;
`;

const AutomateWrapper = styled(CoolStyles.InlineBlock)`
   width: ${CONTEXT_SIZE_PX + TILE_SIZE_PX + 20}px;
`;

const RecentResult = styled(CoolStyles.Block)`
   margin: 1rem;
`;

const DetailsWrapper = styled(CoolStyles.InlineBlock)`
   margin: 0;
`;

export class FieldClassify extends Component {

   static propTypes = {
      level: PropTypes.number.isRequired,
      width_px: PropTypes.number.isRequired,
   }

   state = {
      new_tiles: [],
      new_loading: true,
      completed_loading: true,
      indexed_loading: true,
      tile_index: -1,
      most_recent_result: ''
   };

   componentDidMount() {
      const {level} = this.props;
      const level_key = `classify_index_${level}`
      const tile_index = localStorage.getItem(level_key)

      FractoDataLoader.load_tile_set_async(BIN_VERB_POTENTIALS, result => {
         const new_tiles = FractoData.get_cached_tiles(level, BIN_VERB_POTENTIALS)
         console.log("FractoDataLoader.load_tile_set_async", BIN_VERB_POTENTIALS, result)
         this.setState({
            new_loading: false,
            new_tiles: new_tiles,
            tile_index: new_tiles.length && tile_index ? parseInt(tile_index) : 0
         });
      })
      FractoDataLoader.load_tile_set_async(BIN_VERB_COMPLETED, result => {
         console.log("FractoDataLoader.load_tile_set_async", BIN_VERB_COMPLETED, result)
         this.setState({completed_loading: false});
      });
      FractoDataLoader.load_tile_set_async(BIN_VERB_INDEXED, result => {
         console.log("FractoDataLoader.load_tile_set_async", BIN_VERB_INDEXED, result)
         this.setState({indexed_loading: false});
      });
   }

   static move_tile = (short_code, from, to, cb) => {
      FractoUtil.tile_to_bin(short_code, from, to, result => {
         console.log("FractoUtil.tile_to_bin", short_code, from, to, result);
         cb(result.result)
      })
   }

   static classify_tile = (tile, cb) => {
      console.log("classify_tile", tile)

      const parent_short_code = tile.short_code.substr(0, tile.short_code.length - 1)
      FractoMruCache.get_tile_data(parent_short_code, tile_data => {
         // console.log("FractoMruCache.get_tile_data", parent_short_code, tile_data);
         if (!tile_data.length) {
            FieldClassify.move_tile(parent_short_code, "indexed", "new", result => {
               const message = "error reading parent tile"
               cb(message)
            })
            return;
         }
         const quad_code = tile.short_code[tile.short_code.length - 1];
         console.log("tile.short_code, parent_short_code, quad_code", tile.short_code, parent_short_code, quad_code)
         let col_start, col_end, row_start, row_end;
         switch (tile.short_code[tile.short_code.length - 1]) {
            case '0':
               col_start = 0;
               col_end = 128;
               row_start = 0;
               row_end = 128;
               break;
            case '1':
               col_start = 128;
               col_end = 256;
               row_start = 0;
               row_end = 128;
               break;
            case '2':
               col_start = 0;
               col_end = 128;
               row_start = 128;
               row_end = 256;
               break;
            case '3':
               col_start = 128;
               col_end = 256;
               row_start = 128;
               row_end = 256;
               break;
            default:
               console.log('bad quad_code');
               break;
         }
         let is_empty = true;
         let is_inland = true;
         let is_error = false;
         for (let img_x = col_start; img_x < col_end; img_x++) {
            if (!tile_data[img_x]) {
               is_error = true;
               break;
            }
            for (let img_y = row_start; img_y < row_end; img_y++) {
               if (!tile_data[img_x][img_y]) {
                  is_error = true;
                  break;
               }
               const patern = tile_data[img_x][img_y][0];
               const iterations = tile_data[img_x][img_y][1];
               if (!patern) {
                  is_inland = false;
                  if (iterations > 20) {
                     is_empty = false;
                  }
               } else {
                  is_empty = false;
               }
            }
            if ((!is_empty && !is_inland) || is_error) {
               break;
            }
         }
         let directory_bin = 'ready';
         if (is_error) {
            directory_bin = 'error';
         } else if (is_empty) {
            directory_bin = 'empty';
         } else if (is_inland) {
            directory_bin = 'inland';
         }
         FieldClassify.move_tile(tile.short_code, "new", directory_bin, result => {
            const message = `moving tile to ${directory_bin}: ${result}`
            cb(message)
         })
      }, false);
   }

   on_tile_select = (tile_index) => {
      const {level} = this.props;
      this.setState({tile_index: tile_index})
      const level_key = `classify_index_${level}`
      localStorage.setItem(level_key, `${tile_index}`)
   }

   classify_tile_wrapper = (tile, cb) => {
      FieldClassify.classify_tile(tile, message => {
         this.setState({most_recent_result: message})
         cb(message)
      })
   }

   render() {
      const {
         new_tiles, tile_index, most_recent_result,
         new_loading, indexed_loading, completed_loading
      } = this.state;
      const {level, width_px} = this.props;
      if (new_loading || indexed_loading || completed_loading) {
         return FractoCommon.loading_wait_notice()
      }
      if (!new_tiles.length) {
         return "no tiles"
      }
      if (tile_index < 0) {
         return "no tile"
      }
      return <FieldWrapper>
         <AutomateWrapper>
            <FractoTileAutomate
               all_tiles={new_tiles}
               tile_index={tile_index}
               level={level - 1}
               tile_action={this.classify_tile_wrapper}
               on_tile_select={tile_index => this.on_tile_select(tile_index)}
               no_tile_mode={true}
            />
         </AutomateWrapper>
         <DetailsWrapper>
            <FractoTileDetails
               active_tile={new_tiles[tile_index]}
               width_px={width_px - (CONTEXT_SIZE_PX + TILE_SIZE_PX) - 40 - 2 * WRAPPER_MARGIN_PX}
            />
            <RecentResult>{most_recent_result}</RecentResult>
         </DetailsWrapper>
      </FieldWrapper>
   }
}

export default FieldClassify;
