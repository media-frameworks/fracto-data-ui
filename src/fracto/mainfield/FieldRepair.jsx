import {Component} from 'react';
import PropTypes from 'prop-types';
import styled from "styled-components";

import {CoolStyles} from 'common/ui/CoolImports';

import FractoDataLoader from "../common/data/FractoDataLoader";
import FractoData, {BIN_VERB_COMPLETED, BIN_VERB_ERROR, BIN_VERB_INDEXED} from "../common/data/FractoData";
import FractoCommon from "../common/FractoCommon";
import FractoTileAutomate, {CONTEXT_SIZE_PX, TILE_SIZE_PX} from "../common/tile/FractoTileAutomate";
import FractoTileDetails from "../common/tile/FractoTileDetails";
import FieldClassify from "./FieldClassify";
import FractoUtil from "../common/FractoUtil";

const WRAPPER_MARGIN_PX = 25

const FieldWrapper = styled(CoolStyles.Block)`
   margin: ${WRAPPER_MARGIN_PX}px;
`;

const DetailsWrapper = styled(CoolStyles.InlineBlock)`
   margin: 0;
`;

const StatusTextWrapper = styled(CoolStyles.Block)`
   ${CoolStyles.uppercase};
   ${CoolStyles.bold};
   ${CoolStyles.underline};
   font-size: 0.85;
   letter-spacing: 0.125rem;
   margin-bottom: 0.5rem;
`;

const AutomateWrapper = styled(CoolStyles.InlineBlock)`
   width: ${CONTEXT_SIZE_PX + TILE_SIZE_PX + 20}px;
`;

const RecentResult = styled(CoolStyles.Block)`
   margin: 1rem;
`;

export class FieldRepair extends Component {

   static propTypes = {
      level: PropTypes.number.isRequired,
      width_px: PropTypes.number.isRequired,
   }

   state = {
      error_tiles: [],
      tile_index: -1,
      completed_loading: true,
      indexed_loading: true,
      error_loading: true,
      most_recent_result: ''
   };

   componentDidMount() {
      const {level} = this.props;
      const level_key = `repair_index_${level}`
      const tile_index = localStorage.getItem(level_key)
      FractoDataLoader.load_tile_set_async(BIN_VERB_ERROR, result => {
         console.log("FractoDataLoader.load_tile_set_async", BIN_VERB_ERROR, result)
         const error_tiles = FractoData.get_cached_tiles(level, BIN_VERB_ERROR)
         this.setState({
            error_tiles: error_tiles,
            tile_index: tile_index ? parseInt(tile_index) : 0,
            error_loading: false
         });
      });
      FractoDataLoader.load_tile_set_async(BIN_VERB_COMPLETED, result => {
         console.log("FractoDataLoader.load_tile_set_async", BIN_VERB_COMPLETED, result)
         this.setState({completed_loading: false});
      });
      FractoDataLoader.load_tile_set_async(BIN_VERB_INDEXED, result => {
         console.log("FractoDataLoader.load_tile_set_async", BIN_VERB_INDEXED, result)
         this.setState({indexed_loading: false});
      });
   }

   on_tile_select = (tile_index) => {
      const {error_tiles} = this.state;
      const {level} = this.props;
      if (tile_index >= error_tiles.length) {
         return;
      }
      console.log("on_tile_select", error_tiles[tile_index])
      this.setState({tile_index: tile_index})
      const level_key = `repair_index_${level}`
      localStorage.setItem(level_key, `${tile_index}`)
   }

   move_tile = (short_code, from, to, cb) => {
      FractoUtil.tile_to_bin(short_code, from, to, result => {
         console.log("FractoUtil.tile_to_bin", short_code, from, to, result);
         cb(result.result)
      })
   }

   repair_tile = (tile, cb) => {
      this.move_tile(tile.short_code, "error", "new", result => {
         FieldClassify.classify_tile(tile, message => {
            cb(message)
            this.setState({most_recent_result: message})
         })
      })
   }

   render() {
      const {
         error_tiles, tile_index,
         completed_loading, error_loading, indexed_loading,
         most_recent_result
      } = this.state;
      const {level, width_px} = this.props;
      if (completed_loading || error_loading || indexed_loading) {
         return FractoCommon.loading_wait_notice()
      }
      const details_width = width_px - (CONTEXT_SIZE_PX + TILE_SIZE_PX) - 40 - 2 * WRAPPER_MARGIN_PX;
      const details_style = {
         width: `${details_width}px`
      }
      const active_tile = tile_index >= error_tiles.length ? {} : error_tiles[tile_index]
      return <FieldWrapper>
         <AutomateWrapper>
            <FractoTileAutomate
               all_tiles={error_tiles}
               tile_index={tile_index}
               level={level - 1}
               tile_action={this.repair_tile}
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

export default FieldRepair;
