import {Component} from 'react';
import PropTypes from 'prop-types';
import styled from "styled-components";

import network from "common/config/network.json";
import {CoolStyles} from "common/ui/CoolImports";

import FractoDataLoader from "../common/data/FractoDataLoader";
import FractoData, {BIN_VERB_INDEXED} from "../common/data/FractoData";
import FractoCommon from "../common/FractoCommon";
import FractoTileAutomate, {CONTEXT_SIZE_PX, TILE_SIZE_PX} from "../common/tile/FractoTileAutomate";
import FractoTileDetails from "../common/tile/FractoTileDetails";

const WRAPPER_MARGIN_PX = 25
const FRACTO_DB_URL = network.db_server_url;

const FieldWrapper = styled(CoolStyles.Block)`
   margin: ${WRAPPER_MARGIN_PX}px;
`;

const DetailsWrapper = styled(CoolStyles.InlineBlock)`
   margin: 0;
`;

const AutomateWrapper = styled(CoolStyles.InlineBlock)`
   width: ${CONTEXT_SIZE_PX + TILE_SIZE_PX + 20}px;
`;

export class FieldEdge extends Component {

   static propTypes = {
      level: PropTypes.number.isRequired,
      width_px: PropTypes.number.isRequired,
   }

   state = {
      loading: true,
      tile_index: 0,
      edge_tiles: []
   };

   componentDidMount() {
      const {level} = this.props;
      FractoDataLoader.load_tile_set_async(BIN_VERB_INDEXED, result => {
         console.log("FractoDataLoader.load_tile_set_async", BIN_VERB_INDEXED, result)
         const indexed_tiles = FractoData.get_cached_tiles(level, BIN_VERB_INDEXED)
         const tile_index = parseInt(localStorage.getItem(`edge_tile_index_${level}`))
         this.setState({
            edge_tiles: indexed_tiles,
            tile_index: tile_index ? tile_index : 0,
            loading: false
         });
         // this.get_cached_tiles()
      });
   }

   componentDidUpdate(prevProps, prevState, snapshot) {
      if (prevProps.level === this.props.level) {
         return;
      }
      this.get_cached_tiles()
   }

   get_cached_tiles = () => {
      const {level} = this.props;
      const tile_index = parseInt(localStorage.getItem(`edge_tile_index_${level}`))
      this.fetch_tiles(tiles => {
         console.log("fetch_tiles returns", tiles)
         const edge_tiles = tiles.map(tile => {
            return {
               bounds: {
                  top: tile.bounds_top,
                  bottom:tile.bounds_bottom,
                  left:tile.bounds_left,
                  right:tile.bounds_right,
               },
               short_code: tile.short_code
            }
         }).sort((a, b) => {
            return a.bounds.left === b.bounds.left ?
               (a.bounds.top > b.bounds.top ? -1 : 1) :
               (a.bounds.left > b.bounds.left ? 1 : -1)
         })
         console.log("edge_tiles", edge_tiles)
         this.setState({
            edge_tiles: edge_tiles,
            tile_index: tile_index ? tile_index : 0,
            loading: false
         });
      })
   }

   fetch_tiles = (cb) => {
      const {level} = this.props;
      const url = `${FRACTO_DB_URL}/level_tiles?level=${level}`
      console.log("fetch_tiles", url)
      fetch(url)
         .then(response => response.text())
         .then((str) => {
            const unfiltered = JSON.parse(str)
            const tiles = unfiltered.filter(tile => {
               if (tile.pattern_count > 0) {
                  return false;
               }
               if (tile.highest_iteration_value > 2 * level) {
                  return false;
               }
               if (tile.bounds_bottom === 0) {
                  return false;
               }
               console.log("tile wins!", tile)
               return true;
            })
            cb(tiles)
         })
   }

   on_tile_select = (tile_index) => {
      const {edge_tiles} = this.state;
      const {level} = this.props
      if (tile_index >= edge_tiles.length) {
         return;
      }
      this.setState({tile_index: tile_index})
      localStorage.setItem(`edge_tile_index_${level}`, tile_index)
      const tile = edge_tiles[tile_index]
      console.log("on_tile_select", tile)
      this.load_tile_meta(tile, meta_data => {
         if (!meta_data) {
            this.setState({
               status_text: "no metadata found",
               meta_data: {}
            })
         }
      })
   }

   render() {
      const {loading, tile_index, edge_tiles} = this.state
      const {level, width_px} = this.props;
      if (loading) {
         return FractoCommon.loading_wait_notice()
      }
      const details_width = width_px - (CONTEXT_SIZE_PX + TILE_SIZE_PX) - 40 - 2 * WRAPPER_MARGIN_PX;
      const details_style = {
         width: `${details_width}px`
      }
      const active_tile = tile_index >= edge_tiles.length ? {} : edge_tiles[tile_index]
      return <FieldWrapper>
         <AutomateWrapper>
            <FractoTileAutomate
               all_tiles={edge_tiles }
               tile_index={tile_index}
               level={level - 1}
               tile_action={this.meta_tile}
               on_tile_select={this.on_tile_select}
            />
         </AutomateWrapper>
         <DetailsWrapper style={details_style}>
            <FractoTileDetails
               active_tile={active_tile}
               width_px={details_width}
            />
         </DetailsWrapper>
      </FieldWrapper>
   }
}

export default FieldEdge;
