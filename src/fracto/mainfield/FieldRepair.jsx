import {Component} from 'react';
import PropTypes from 'prop-types';
// import styled from "styled-components";
//
// import {CoolStyles} from 'common/ui/CoolImports';

import FractoDataLoader from "../common/data/FractoDataLoader";
import FractoData, {BIN_VERB_ERROR} from "../common/data/FractoData";
import FractoTileAutomator from "../common/tile/FractoTileAutomator";
import FractoCommon from "../common/FractoCommon";
import FractoUtil from "../common/FractoUtil";
import FieldClassify from "./FieldClassify";
import FractoMruCache from "../common/data/FractoMruCache";

export class FieldRepair extends Component {

   static propTypes = {
      level: PropTypes.number.isRequired,
      width_px: PropTypes.number.isRequired,
   }

   state = {
      error_tiles: [],
      error_loading: true,
   };

   componentDidMount() {
      const {level} = this.props;
      FractoDataLoader.load_tile_set_async(BIN_VERB_ERROR, result => {
         console.log("FractoDataLoader.load_tile_set_async", BIN_VERB_ERROR, result)
         const error_tiles = FractoData.get_cached_tiles(level, BIN_VERB_ERROR)
         this.setState({
            error_tiles: error_tiles,
            error_loading: false
         });
      });
   }

   move_tile = (short_code, from, to, cb) => {
      FractoUtil.tile_to_bin(short_code, from, to, result => {
         console.log("FractoUtil.tile_to_bin", short_code, from, to, result);
         cb(result.result)
      })
   }

   repair_tile = (tile, cb) => {
      const parent_short_code = tile.short_code.substr(0, tile.short_code.length - 1)
      FractoMruCache.get_tile_data(parent_short_code, tile_data => {
         if (!tile_data || !tile_data.length) {
            this.move_tile(tile.short_code, "error", "deleted", result => {
               const message = `parent tile missing, deleted ${result}`
               cb(message)
            })
         } else {
            this.move_tile(tile.short_code, "error", "new", result => {
               FieldClassify.classify_tile(tile, message => {
                  cb(message)
               })
            })
         }
      });
   }

   render() {
      const {error_tiles, error_loading} = this.state;
      const {level, width_px} = this.props;
      if (error_loading) {
         return FractoCommon.loading_wait_notice()
      }
      return <FractoTileAutomator
         all_tiles={error_tiles}
         level={level - 1}
         tile_action={this.repair_tile}
         descriptor={"repair"}
         width_px={width_px}
      />
   }
}

export default FieldRepair;
