import {Component} from 'react';
import PropTypes from 'prop-types';
import styled from "styled-components";

import {CoolStyles} from 'common/ui/CoolImports';
import StoreS3 from 'common/system/StoreS3';

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
      FractoDataLoader.load_tile_set_async(BIN_VERB_POTENTIALS, result => {
         console.log("FractoDataLoader.load_tile_set_async", BIN_VERB_POTENTIALS, result)
         const new_tiles = FractoData.get_cached_tiles(level, BIN_VERB_POTENTIALS)
         this.setState({
            new_loading: false,
            new_tiles: new_tiles,
            tile_index: 0
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

   move_tile = (short_code, from, to, cb) => {
      FractoUtil.tile_to_bin(short_code, from, to, result => {
         console.log("FractoUtil.tile_to_bin", short_code, from, to, result);
         cb(result.result)
      })
   }

   classify_tile = (tile, cb) => {
      console.log("classify_tile", tile)

      const parent_short_code = tile.short_code.substr(0, tile.short_code.length - 1)
      const json_name = `tiles/256/indexed/${parent_short_code}.json`;
      StoreS3.get_file_async(json_name, "fracto", json_str => {
         console.log("StoreS3.get_file_async", json_name);
         if (!json_str) {
            this.move_tile(tile.short_code, "new", "error", result => {
               const message = "error reading parent tile"
               this.setState({most_recent_result: message})
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
         const tile_data = JSON.parse(json_str);
         for (let img_x = col_start; img_x < col_end; img_x++) {
            for (let img_y = row_start; img_y < row_end; img_y++) {
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
            if (!is_empty && !is_inland) {
               break;
            }
         }
         let directory_bin = 'ready';
         if (is_empty) {
            directory_bin = 'empty';
         } else if (is_inland) {
            directory_bin = 'inland';
         }
         this.move_tile(tile.short_code, "new", directory_bin, result => {
            const message = `moving tile to ${directory_bin}: ${result}`
            this.setState({most_recent_result: message})
            cb(message)
         })
      }, false);
   }

   render() {
      const {
         new_tiles, tile_index, most_recent_result,
         new_loading, indexed_loading, completed_loading
      } = this.state;
      const {level, width_px} = this.props;
      const loading = !new_loading && !indexed_loading && !completed_loading
      if (loading) {
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
               tile_action={this.classify_tile}
               on_tile_select={tile_index => this.setState({tile_index: tile_index})}
               no_tile_mode={true}
            />
         </AutomateWrapper>
         <FractoTileDetails
            active_tile={new_tiles[tile_index]}
            width_px={width_px - (CONTEXT_SIZE_PX + TILE_SIZE_PX) - 40 - 2 * WRAPPER_MARGIN_PX}
         />
         <RecentResult>{most_recent_result}</RecentResult>
      </FieldWrapper>
   }
}

export default FieldClassify;
