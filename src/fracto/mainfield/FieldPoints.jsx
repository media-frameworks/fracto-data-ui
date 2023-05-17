import React, {Component} from 'react';
import PropTypes from 'prop-types';
import styled from "styled-components";

import network from "common/config/network.json";
import {CoolStyles} from 'common/ui/CoolImports';

import FractoData, {BIN_VERB_INDEXED} from 'fracto/common/data/FractoData';
import FractoDataLoader from 'fracto/common/data/FractoDataLoader';
import FractoCommon from "../common/FractoCommon";

import FractoTileAutomate, {CONTEXT_SIZE_PX, TILE_SIZE_PX} from 'fracto/common/tile/FractoTileAutomate';
import FractoTileDetails from 'fracto/common/tile/FractoTileDetails';
import FractoUtil from "fracto/common/FractoUtil";

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

const FractoCanvas = styled.canvas`
   margin: 0;
`;

export class FieldPoints extends Component {

   static propTypes = {
      level: PropTypes.number.isRequired,
      width_px: PropTypes.number.isRequired,
   }

   state = {
      indexed_tiles: [],
      tile_index: -1,
      status_text: '',
      canvas_ref: React.createRef(),
      free_points: []
   };

   componentDidMount() {
      const {level} = this.props;
      FractoDataLoader.load_tile_set_async(BIN_VERB_INDEXED, result => {
         console.log("FractoDataLoader.load_tile_set_async", BIN_VERB_INDEXED, result)
         const indexed_tiles = FractoData.get_cached_tiles(level, BIN_VERB_INDEXED)
         this.setState({
            indexed_tiles: indexed_tiles,
            tile_index: 0
         });
      });
   }

   points_tile = (tile, cb) => {
      if (!tile) {
         cb(false);
         return;
      }
   }

   on_tile_select = (tile_index) => {
      const {indexed_tiles} = this.state;
      if (tile_index >= indexed_tiles.length) {
         return;
      }
      const tile = indexed_tiles[tile_index]
      this.fetch_free_points(tile, free_points => {
         console.log("free_points.length", free_points.length)
         this.setState({
            tile_index: tile_index,
            free_points: free_points
         })
      })
   }

   fetch_free_points = (tile, cb) => {
      const url = `${FRACTO_DB_URL}/free_points?left=${tile.bounds.left}&right=${tile.bounds.right}&top=${tile.bounds.top}&bottom=${tile.bounds.bottom}`
      console.log("fetch_free_points", url)
      fetch(url)
         .then(response => response.text())
         .then((str) => {
            const free_points = JSON.parse(str)
            console.log("free_points", free_points)
            cb(free_points)
         })
   }

   render_points = (tile, tile_width_px) => {
      const {canvas_ref, free_points} = this.state
      const canvas = canvas_ref.current;
      if (!canvas) {
         console.log('no canvas');
         return;
      }
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = `#f8f8f8`
      ctx.fillRect(0, 0, tile_width_px, tile_width_px);

      const tile_width = tile.bounds.right - tile.bounds.left
      const x_increment = tile_width / tile_width_px
      let pixel_size = 2
      if (free_points.length > 50000) {
         pixel_size = 1
      }
      for (let i = 0; i < free_points.length; i++) {
         const point = free_points[i]
         const img_x = (point.x - tile.bounds.left) / x_increment
         const img_y = Math.abs((tile.bounds.top - point.y) / x_increment)
         ctx.fillStyle = FractoUtil.fracto_pattern_color(point.pattern, point.iteration)
         ctx.fillRect(img_x, img_y, pixel_size, pixel_size);
      }
   }

   on_render_tile = (tile, tile_width_px) => {
      const {canvas_ref} = this.state
      console.log("tile, tile_width_px", tile, tile_width_px)
      setTimeout(() => {
         this.render_points(tile, tile_width_px)
      }, 100)
      return <FractoCanvas
         ref={canvas_ref}
         width={tile_width_px}
         height={tile_width_px}
      />
   }

   render() {
      const {indexed_tiles, tile_index, status_text} = this.state;
      const {level, width_px} = this.props;
      if (!indexed_tiles.length) {
         return FractoCommon.loading_wait_notice()
      }
      const details_width = width_px - (CONTEXT_SIZE_PX + TILE_SIZE_PX) - 40 - 2 * WRAPPER_MARGIN_PX;
      const details_style = {
         width: `${details_width}px`
      }
      const active_tile = tile_index >= indexed_tiles.length ? {} : indexed_tiles[tile_index]
      return <FieldWrapper>
         <AutomateWrapper>
            <FractoTileAutomate
               all_tiles={indexed_tiles}
               tile_index={tile_index}
               level={level - 1}
               tile_action={this.points_tile}
               on_tile_select={this.on_tile_select}
               on_render_tile={(tile, tile_width_px) => this.on_render_tile(tile, tile_width_px)}
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

export default FieldPoints;
