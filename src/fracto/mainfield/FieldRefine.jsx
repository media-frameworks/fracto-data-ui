import {Component} from 'react';
import PropTypes from 'prop-types';
// import styled from "styled-components";
//
import {CoolStyles} from 'common/ui/CoolImports';

import FractoTileAutomator from "../common/tile/FractoTileAutomator";
import FractoCommon from "../common/FractoCommon";
import FractoIndexedTiles from "../common/data/FractoIndexedTiles";
import FractoMruCache from "../common/data/FractoMruCache";
import FractoTileRender from "../common/tile/FractoTileRender";
import FractoFastCalc from "../common/data/FractoFastCalc";
// import FractoCalc from "../common/data/FractoCalc";

// const ITERATION_LIMIT = 100000

export class FieldRefine extends Component {

   static propTypes = {
      level: PropTypes.number.isRequired,
      width_px: PropTypes.number.isRequired,
   }

   state = {
      indexed_tiles: [],
      tile_points_before: [],
      incomplete_points: 0,
      inaccurate_points: 0,
      tile_is_empty: false,
      show_replacement: false
   };

   componentDidMount() {
      const {level} = this.props;
      const indexed_tiles = FractoIndexedTiles.tiles_in_level(level)
      this.setState({indexed_tiles: indexed_tiles})
   }

   componentDidUpdate(prevProps, prevState, snapshot) {
      const {level} = this.props;
      if (prevProps.level === level) {
         return;
      }
      const indexed_tiles = FractoIndexedTiles.tiles_in_level(level)
      this.setState({indexed_tiles: indexed_tiles})
   }

   refine_tile = (tile, cb) => {
      const {tile_points_before} = this.state
      const {level} = this.props
      const increment = (tile.bounds.right - tile.bounds.left) / 256.0;
      const [pattern0, iteration0] = tile_points_before[0][0]
      let might_be_empty = pattern0 === 0
      let replacement_tile = null
      let incomplete_points = 0
      let inaccurate_points = 0
      console.log('tile', tile)
      for (let img_x = 0; img_x < 256; img_x++) {
         const x = tile.bounds.left + img_x * increment;
         // console.log(`x = ${x}`)
         for (let img_y = 0; img_y < 256; img_y++) {
            const y = tile.bounds.top - img_y * increment;
            const [pattern, iteration] = tile_points_before[img_x][img_y]
            if (might_be_empty && (pattern !== pattern0 || iteration !== iteration0)) {
               might_be_empty = false
            }
            // if (pattern > 0 && iteration < ITERATION_LIMIT) {
            //    const retry_results = FractoCalc.calc(x, y)
            //    if (retry_results.pattern !== pattern || retry_results.iteration !== iteration + 1) {
            //       if (!replacement_tile) {
            //          replacement_tile = JSON.parse(JSON.stringify(tile_points_before))
            //       }
            //       inaccurate_points++
            //       replacement_tile [img_x][img_y] = [retry_results.pattern, retry_results.iteration]
            //       console.log(`pattern: ${retry_results.pattern} !== ${pattern} or oteration: ${retry_results.iteration} !== ${iteration} `)
            //    }
            //    continue
            // }
            if (pattern === -1) {
               if (!replacement_tile) {
                  replacement_tile = JSON.parse(JSON.stringify(tile_points_before))
               }
               const values = FractoFastCalc.calc(x, y, level)
               incomplete_points++
               replacement_tile[img_x][img_y] = [values.pattern, values.iteration];
            }
         }
      }
      this.setState({
         replacement_tile: replacement_tile,
         tile_is_empty: might_be_empty,
         incomplete_points, inaccurate_points
      })
      if (might_be_empty || replacement_tile) {
         cb(false)
      } else {
         setTimeout(() => {
            cb(true)
         }, 500)
      }
   }

   on_select_tile = (tile, cb = null) => {
      if (!tile) {
         if (cb) {
            cb(false)
         }
         return
      }
      FractoMruCache.get_tile_data(tile.short_code, tile_points => {
         this.setState({tile_points_before: tile_points})
         if (cb) {
            cb('tile selected')
         }
      })
   }

   on_render_tile = (tile, width_px) => {
      const {tile_points_before} = this.state
      if (!tile_points_before.length) {
         return <CoolStyles.InlineBlock style={{width: `${width_px}px`}}>
            {'no tile points'}
         </CoolStyles.InlineBlock>
      }
      return <FractoTileRender
         key={`render-${tile.short_code}`}
         tile={tile}
         width_px={width_px}
         tile_data={tile_points_before}/>
   }

   on_render_detail = (tile, detail_width_px) => {
      const {inaccurate_points, incomplete_points, tile_is_empty, show_replacement} = this.state
      const stats = [
         {label: 'tile is empty', value: tile_is_empty},
         {label: 'incomplete points', value: incomplete_points},
         {label: 'inaccurate points', value: inaccurate_points},
      ].map((obj, index) => {
         return <CoolStyles.Block key={`stats-row-${index}`}>
            {`${obj.label}: ${obj.value}`}
         </CoolStyles.Block>
      })
      const button = <CoolStyles.LinkSpan
         key={'show-replacement'}
         onClick={() => this.setState({show_replacement: !show_replacement})}>
         {`${show_replacement ? 'hide' : 'show'} replacement`}
      </CoolStyles.LinkSpan>
      return [stats, button]
   }

   on_automate = (automate) => {
      console.log('on_automate', automate)
   }

   render() {
      const {indexed_tiles} = this.state;
      const {level, width_px} = this.props;
      if (!indexed_tiles.length) {
         return FractoCommon.loading_wait_notice('in FieldRefine')
      }
      return <FractoTileAutomator
         all_tiles={indexed_tiles}
         level={level}
         tile_action={this.refine_tile}
         on_select_tile={this.on_select_tile}
         on_render_tile={this.on_render_tile}
         on_render_detail={this.on_render_detail}
         descriptor={"refine"}
         width_px={width_px}
         on_automate={this.on_automate}
      />
   }
}

export default FieldRefine;
