import {Component} from 'react';
import PropTypes from 'prop-types';
// import styled from "styled-components";
//
// import {CoolStyles} from 'common/ui/CoolImports';

import FractoCommon from "../common/FractoCommon";
import FractoDataLoader from "../common/data/FractoDataLoader";
import FractoData, {BIN_VERB_COMPLETED} from "../common/data/FractoData";
import FractoUtil from "../common/FractoUtil";
import FractoMruCache from "../common/data/FractoMruCache";
import FractoTileAutomator from "../common/tile/FractoTileAutomator";

export class FieldIndex extends Component {

   static propTypes = {
      level: PropTypes.number.isRequired,
      width_px: PropTypes.number.isRequired,
   }

   state = {
      completed_tiles: [],
      loading: true,
   };

   componentDidMount() {
      this.initalize_tile_sets()
   }

   componentDidUpdate(prevProps: Readonly<P>, prevState: Readonly<S>, snapshot: SS) {
      if (prevProps.level !== this.props.level) {
         this.initalize_tile_sets()
      }
   }

   initalize_tile_sets=()=>{
      const {level} = this.props;
      this.setState({loading: true})
      FractoDataLoader.load_tile_set_async(BIN_VERB_COMPLETED, result => {
         console.log("FractoDataLoader.load_tile_set_async", BIN_VERB_COMPLETED, result)
         const completed_tiles = FractoData.get_cached_tiles(level, BIN_VERB_COMPLETED)
         this.setState({
            completed_tiles: completed_tiles,
            loading: false
         });
      });
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
      const {completed_tiles, loading} = this.state;
      const {level, width_px} = this.props;
      if (loading) {
         return FractoCommon.loading_wait_notice()
      }
      return <FractoTileAutomator
         all_tiles={completed_tiles}
         level={level - 1}
         tile_action={this.index_tile}
         descriptor={"index"}
         width_px={width_px}
      />
   }
}

export default FieldIndex;
