import {Component} from 'react';
import PropTypes from 'prop-types';
import styled from "styled-components";

import {CoolStyles} from 'common/ui/CoolImports';
import StoreS3 from 'common/system/StoreS3';

import FractoData, {BIN_VERB_INDEXED} from 'fracto/common/data/FractoData';
import FractoDataLoader from 'fracto/common/data/FractoDataLoader';
import FractoMruCache from "fracto/common/data/FractoMruCache";
import FractoCommon from "../common/FractoCommon";

import FractoTileAutomate, {CONTEXT_SIZE_PX, TILE_SIZE_PX} from 'fracto/common/tile/FractoTileAutomate';
import FractoTileDetails from 'fracto/common/tile/FractoTileDetails';
import FractoTileMeta from 'fracto/common/tile/FractoTileMeta';

const WRAPPER_MARGIN_PX = 25

const FieldWrapper = styled(CoolStyles.Block)`
   margin: ${WRAPPER_MARGIN_PX}px;
`;

const DetailsWrapper = styled(CoolStyles.InlineBlock)`
   margin: 0;
`;

const MetaDataWrapper = styled(CoolStyles.InlineBlock)`
   margin-left: 1rem;
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

export class FieldMeta extends Component {

   static propTypes = {
      level: PropTypes.number.isRequired,
      width_px: PropTypes.number.isRequired,
   }

   state = {
      indexed_tiles: [],
      tile_index: -1,
      status_text: '',
      meta_data: {}
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
         this.load_tile_meta(indexed_tiles[0], meta_data => {
            console.log("load_tile_meta", meta_data)
         })
      });
   }

   static generate_tile_meta = (short_code, tile_data, cb) => {
      let highest_iteration_value = 0;
      let max_iteration_count = 0;
      let pattern_count = 0;
      let total_iterations = 0;
      for (let img_x = 0; img_x < 256; img_x++) {
         for (let img_y = 0; img_y < 256; img_y++) {
            const [pattern, iterations] = tile_data[img_x][img_y];
            if (pattern) {
               pattern_count++;
            }
            if (iterations > 999999) {
               max_iteration_count++;
            }
            if (iterations > highest_iteration_value) {
               highest_iteration_value = iterations;
            }
            total_iterations += iterations;
         }
      }
      const meta_data = {
         highest_iteration_value: highest_iteration_value,
         max_iteration_count: max_iteration_count,
         pattern_count: pattern_count,
         total_iterations: total_iterations
      }
      console.log("meta_data", short_code, meta_data);

      const meta_name = `tiles/256/meta/${short_code}.json`;
      StoreS3.put_file_async(meta_name, JSON.stringify(meta_data), "fracto", result => {
         console.log("StoreS3.put_file_async", meta_name, result)
         cb("Tile meta saved")
      })
      return meta_data;
   }

   meta_tile = (tile, cb) => {
      if (!tile) {
         cb(false);
         return;
      }
      const meta_name = `tiles/256/meta/${tile.short_code}.json`;
      StoreS3.get_file_async(meta_name, "fracto", result => {
         console.log("StoreS3.get_file_async", meta_name, result)
         if (!result) {
            this.setState({status_text: "generating metadata..."})
            FractoMruCache.get_tile_data(tile.short_code, tile_data => {
               FieldMeta.generate_tile_meta(tile.short_code, tile_data, cb)
            })
         } else {
            this.setState({status_text: "metadata exists"})
            cb(true);
         }
      })
   }

   load_tile_meta = (tile, cb) => {
      const meta_name = `tiles/256/meta/${tile.short_code}.json`;
      StoreS3.get_file_async(meta_name, "fracto", result => {
         console.log("StoreS3.get_file_async", meta_name, result)
         if (result) {
            const meta_data = JSON.parse(result)
            this.setState({
               status_text: "metadata exists",
               meta_data: meta_data
            })
            cb(meta_data)
         } else {
            cb(false)
         }
      })
   }

   on_tile_select = (tile_index) => {
      const {indexed_tiles} = this.state;
      if (tile_index >= indexed_tiles.length) {
         return;
      }
      this.setState({tile_index: tile_index})
      const tile = indexed_tiles[tile_index]
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
      const {indexed_tiles, tile_index, status_text, meta_data} = this.state;
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
               tile_action={this.meta_tile}
               on_tile_select={this.on_tile_select}
            />
         </AutomateWrapper>
         <DetailsWrapper style={details_style}>
            <FractoTileDetails
               active_tile={active_tile}
               width_px={details_width}
            />
            <StatusTextWrapper>{status_text}</StatusTextWrapper>
            <MetaDataWrapper>
               <FractoTileMeta width_px={details_width} meta_data={meta_data}/>
            </MetaDataWrapper>
         </DetailsWrapper>
      </FieldWrapper>
   }
}

export default FieldMeta;
