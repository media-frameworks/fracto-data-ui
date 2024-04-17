import React, {Component} from 'react';
import PropTypes from 'prop-types';
// import styled from "styled-components";
//
// import {CoolStyles} from 'common/ui/CoolImports';
import FractoCommon from "fracto/common/FractoCommon";
import FractoTileAutomator from "fracto/common/tile/FractoTileAutomator";
import FractoDataLoader from "../../fracto/common/data/FractoDataLoader";
import FractoData, {BIN_VERB_COMPLETED} from "../../fracto/common/data/FractoData";

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

   on_render_detail = (tile, detail_width_px) => {
      return "no detail"
   }

   index_tile = (tile, cb) => {
      cb(true)
   }

   render() {
      const {completed_tiles, loading} = this.state;
      const {level, width_px} = this.props;
      if (loading) {
         return FractoCommon.loading_wait_notice()
      }
      if (!completed_tiles.length) {
         return "no tiles to index"
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
