import {Component} from 'react';
import PropTypes from 'prop-types';
// import styled from "styled-components";
//
import {CoolStyles} from 'common/ui/CoolImports';

import FractoCommon from 'fracto/common/FractoCommon';
import FractoUtil from 'fracto/common/FractoUtil';

import FractoMruCache from "../common/data/FractoMruCache";
import FractoTileAutomator from "../common/tile/FractoTileAutomator";
import FractoIndexedTiles from "../common/data/FractoIndexedTiles";

export class FieldClassify extends Component {

   static propTypes = {
      level: PropTypes.number.isRequired,
      width_px: PropTypes.number.isRequired,
   }

   state = {
      potentials_tiles: [],
      potentials_loading: true,
   };

   componentDidMount() {
      this.initalize_tile_sets()
   }

   componentDidUpdate(prevProps: Readonly<P>, prevState: Readonly<S>, snapshot: SS) {
      if (prevProps.level !== this.props.level) {
         this.initalize_tile_sets()
      }
   }

   initalize_tile_sets = () => {
      const {level} = this.props;
      this.setState({loading: true})
      FractoIndexedTiles.load_short_codes("new", potentials_short_codes => {
         console.log("potentials_short_codes.length", potentials_short_codes.length)
         const potentials_tiles = potentials_short_codes
            .filter(sc => sc.length === level)
            .map((short_code, i) => {
               return {
                  bounds: FractoUtil.bounds_from_short_code(short_code),
                  short_code: short_code
               }
            })
            .sort((a, b) => {
               return a.bounds.left === b.bounds.left ?
                  (a.bounds.top > b.bounds.top ? -1 : 1) :
                  (a.bounds.left > b.bounds.left ? 1 : -1)
            })
         this.setState({
            potentials_tiles: potentials_tiles,
            potentials_loading: false,
         })
      })
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
         if (!tile_data || !tile_data.length) {
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

   on_render_tile = (tile, width_px) => {
      return <CoolStyles.InlineBlock style={{width: `${width_px}px`}}>
         {'no tile here'}
      </CoolStyles.InlineBlock>
   }

   on_select_tile = (tile, cb) => {
      if (cb) {
         setTimeout(() => {
            cb(true)
         }, 500)
      }
   }

   render() {
      const {potentials_tiles, potentials_loading} = this.state;
      const {level, width_px} = this.props;
      if (potentials_loading) {
         return FractoCommon.loading_wait_notice("FieldClassify")
      }
      return <FractoTileAutomator
         all_tiles={potentials_tiles}
         level={level - 1}
         tile_action={FieldClassify.classify_tile}
         descriptor={"classify"}
         width_px={width_px}
         on_render_tile={this.on_render_tile}
         on_select_tile={this.on_select_tile}
         auto_refresh={0}
      />
   }
}

export default FieldClassify;
