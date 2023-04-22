import {Component} from 'react';
import PropTypes from 'prop-types';
import styled from "styled-components";

import {CoolStyles} from 'common/ui/CoolImports';
import StoreS3 from 'common/system/StoreS3';

import FractoCommon from "../common/FractoCommon";
import FractoUtil from "../common/FractoUtil";

import FractoCalc from "../common/data/FractoCalc";
import FractoDataLoader from "../common/data/FractoDataLoader";
import FractoData, {BIN_VERB_INDEXED, BIN_VERB_INLAND, BIN_VERB_READY} from "../common/data/FractoData";

import FractoTileAutomate, {CONTEXT_SIZE_PX, TILE_SIZE_PX} from "../common/tile/FractoTileAutomate";
import FractoTileDetails from "../common/tile/FractoTileDetails";

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
      FractoDataLoader.load_tile_set_async(BIN_VERB_READY, result => {
         console.log("FractoDataLoader.load_tile_set_async", BIN_VERB_READY, result)
         const ready_tiles = FractoData.get_cached_tiles(level, BIN_VERB_READY)
         this.setState({
            ready_tiles: ready_tiles,
            ready_tiles_loaded: true,
            tile_index: 0,
         });
      });
      FractoDataLoader.load_tile_set_async(BIN_VERB_INLAND, result => {
         console.log("FractoDataLoader.load_tile_set_async", BIN_VERB_INLAND, result)
         const inland_tiles = FractoData.get_cached_tiles(level, BIN_VERB_INLAND)
         console.log("inland tiles count", inland_tiles.length)
         this.setState({
            inland_tiles: inland_tiles,
            inland_tiles_loaded: true,
            tile_index: 0,
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

   calculate_tile = (tile, tile_points, cb) => {
      console.log("calculate_tile", tile)
      const increment = (tile.bounds.right - tile.bounds.left) / 256.0;
      for (let img_x = 0; img_x < 256; img_x++) {
         const x = tile.bounds.left + img_x * increment;
         for (let img_y = 0; img_y < 256; img_y++) {
            if (img_x % 2 === 0 && img_y % 2 === 0) {
               continue;
            }
            const y = tile.bounds.top - img_y * increment;
            const values = FractoCalc.calc(x, y);
            tile_points[img_x][img_y] = [values.pattern, values.iteration];
         }
      }
      const index_url = `tiles/256/indexed/${tile.short_code}.json`;
      StoreS3.put_file_async(index_url, JSON.stringify(tile_points), "fracto", result => {
         console.log("StoreS3.put_file_async", index_url, result);
         FractoUtil.tile_to_bin(tile.short_code, "ready", "complete", result => {
            console.log("ToolUtils.tile_to_bin", tile.short_code, result);
         })
         FractoUtil.tile_to_bin(tile.short_code, "inland", "complete", result => {
            console.log("ToolUtils.tile_to_bin", tile.short_code, result);
            cb("generated tile")
         })
      })
   }

   prepare_generator = (parent_tile_data, quad_code) => {
      console.log("prepare_generator", parent_tile_data.length, quad_code)
      let col_start, col_end, row_start, row_end;
      switch (quad_code) {
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
            return null;
      }
      const tile_points = new Array(256).fill(0).map(() => new Array(256).fill([0, 0]));
      for (let img_x = col_start, result_col = 0; img_x < col_end; img_x++, result_col += 2) {
         for (let img_y = row_start, result_row = 0; img_y < row_end; img_y++, result_row += 2) {
            tile_points[result_col][result_row] = parent_tile_data[img_x][img_y]
         }
      }
      return tile_points;
   }

   generate_tile = (tile, cb) => {
      const parent_short_code = tile.short_code.substr(0, tile.short_code.length - 1)
      const quad_code = tile.short_code[tile.short_code.length - 1];
      const parent_index_url = `tiles/256/indexed/${parent_short_code}.json`;
      StoreS3.get_file_async(parent_index_url, "fracto", json_str => {
         console.log("StoreS3.get_file_async", parent_index_url);
         if (!json_str) {
            console.log("parent tile for generation", parent_index_url);
            cb("parent tile is not indexed");
         } else {
            const parent_tile_data = JSON.parse(json_str);
            const tile_points = this.prepare_generator(parent_tile_data, quad_code)
            if (!tile_points) {
               cb("error preparing generator")
            } else {
               // setTimeout(() => FractoUtil.data_to_canvas(tile_points, ctx), 100);
               this.calculate_tile(tile, tile_points, result => {
                  // FractoUtil.data_to_canvas(tile_points, ctx)
                  cb(result)
               });
            }
         }
      })
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
         return "no tiles"
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
               tile_action={this.generate_tile}
               on_tile_select={tile_index => this.setState({tile_index: tile_index})}
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
