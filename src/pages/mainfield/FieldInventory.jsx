import React, {Component} from 'react';
import PropTypes from 'prop-types';
// import styled from "styled-components";
//
// import {CoolStyles} from 'common/ui/CoolImports';
import FractoCommon from "fracto/common/FractoCommon";
import FractoTileAutomator from "fracto/common/tile/FractoTileAutomator";
import FractoDataLoader from "../../fracto/common/data/FractoDataLoader";
import FractoData, {BIN_VERB_INDEXED} from "../../fracto/common/data/FractoData";

export class FieldInventory extends Component {

   static propTypes = {
      level: PropTypes.number.isRequired,
      width_px: PropTypes.number.isRequired,
   }

   state = {
      indexed_tiles: [],
      indexed_loading: true,
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
      this.setState({indexed_loading: true})
      FractoDataLoader.load_tile_set_async(BIN_VERB_INDEXED, result => {
         console.log("FractoDataLoader.load_tile_set_async", BIN_VERB_INDEXED, result)
         const indexed_tiles = FractoData.get_cached_tiles(level, BIN_VERB_INDEXED)
         this.setState({
            indexed_tiles: indexed_tiles,
            indexed_loading: false
         });
      });
   }

   on_render_detail = (tile, detail_width_px) => {
      return "no detail"
   }

   inventory_tile=(tile, cb)=>{
      cb (false)
   }

   render() {
      const {indexed_tiles, indexed_loading} = this.state;
      const {level, width_px} = this.props;
      if (indexed_loading) {
         return FractoCommon.loading_wait_notice()
      }
      if (!indexed_tiles.length) {
         return "no tiles to inventory"
      }
      return <FractoTileAutomator
         all_tiles={indexed_tiles}
         level={level - 1}
         tile_action={this.inventory_tile}
         descriptor={"inventory"}
         width_px={width_px}
      />
   }
}

export default FieldInventory;
