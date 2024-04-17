import React, {Component} from 'react';
import PropTypes from 'prop-types';
// import styled from "styled-components";
//
// import {CoolStyles} from 'common/ui/CoolImports';
import FractoCommon from "fracto/common/FractoCommon";
import FractoDataLoader from "fracto/common/data/FractoDataLoader";
import FractoData, {BIN_VERB_POTENTIALS} from "fracto/common/data/FractoData";
import FractoTileAutomator from "fracto/common/tile/FractoTileAutomator";

export class FieldClassify extends Component {

   static propTypes = {
      level: PropTypes.number.isRequired,
      width_px: PropTypes.number.isRequired,
   }

   state = {
      new_tiles: [],
      new_loading: true,
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
      this.setState({new_loading: true})
      FractoDataLoader.load_tile_set_async(BIN_VERB_POTENTIALS, result => {
         const new_tiles = FractoData.get_cached_tiles(level, BIN_VERB_POTENTIALS)
         console.log("FractoDataLoader.load_tile_set_async", BIN_VERB_POTENTIALS, result)
         this.setState({
            new_loading: false,
            new_tiles: new_tiles,
         });
      })
   }

   on_render_detail = (tile, detail_width_px) => {
      return "no detail"
   }

   classify_tile=(tile, cb)=>{
      cb (false)
   }

   render() {
      const {new_tiles, new_loading} = this.state;
      const {level, width_px} = this.props;
      if (new_loading) {
         return FractoCommon.loading_wait_notice()
      }
      if (!new_tiles.length) {
         return "no tiles to classify"
      }
      return <FractoTileAutomator
         all_tiles={new_tiles}
         level={level - 1}
         tile_action={this.classify_tile}
         descriptor={"classify"}
         width_px={width_px}
      />
   }
}

export default FieldClassify;
