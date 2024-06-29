import {Component} from 'react';
import styled from "styled-components";
import PropTypes from 'prop-types';

import FractoUtil from "../common/FractoUtil";
import FractoCommon from "../common/FractoCommon";

import FractoIndexedTiles from "../common/data/FractoIndexedTiles";
import FractoMruCache from "../common/data/FractoMruCache";
import {BIN_VERB_INLAND, BIN_VERB_READY} from "../common/data/FractoData";
import FractoTileRender from "../common/tile/FractoTileRender";
import FractoTileAutomator from "../common/tile/FractoTileAutomator";
import FractoTileGenerate from "../common/tile/FractoTileGenerate";
import {CoolStyles, CoolSelect} from "../../common/ui/CoolImports";

const SORT_LEFT_TO_RIGHT = "sort_left_to_right"
const SORT_RIGHT_TO_LEFT = "sort_right_to_left"
const SORT_TOP_TO_BOTTOM = "sort_top_to_bottom"
const SORT_BOTTOM_TO_TOP = "sort_bottom_to_top"

const LS_KEY_SORT_EXTRA = 'LS_KEY_SORT_EXTRA'

const SelectWrapper = styled(CoolStyles.InlineBlock)`
   margin: 1rem 0.5rem;
`

export class FieldNextGen extends Component {

   static propTypes = {
      level: PropTypes.number.isRequired,
      width_px: PropTypes.number.isRequired,
   }

   state = {
      ready_tiles: [],
      ready_loading: true,
      inland_tiles: [],
      inland_loading: true,
      sort_extra: SORT_LEFT_TO_RIGHT
   };

   componentDidMount() {
      const {level} = this.props;
      const sort_extra = localStorage.getItem(`${LS_KEY_SORT_EXTRA}_${level}`)
      this.setState({sort_extra: sort_extra})
      setTimeout(() => {
         this.load_tile_sets()
      }, 250)
   }

   componentDidUpdate(prevProps, prevState, snapshot) {
      const {level} = this.props;
      if (prevProps.level === level) {
         return
      }
      this.setState({
         ready_loading: true,
         inland_loading: true
      })
      setTimeout(() => {
         this.load_tile_sets()
      }, 250)
   }

   sort_tiles = (tile_set) => {
      const {sort_extra} = this.state
      return tile_set.sort((a, b) => {
         switch (sort_extra) {
            case SORT_LEFT_TO_RIGHT:
               return a.bounds.left === b.bounds.left ?
                  (a.bounds.top > b.bounds.top ? -1 : 1) :
                  (a.bounds.left > b.bounds.left ? 1 : -1)
            case SORT_RIGHT_TO_LEFT:
               return a.bounds.left === b.bounds.left ?
                  (a.bounds.top > b.bounds.top ? -1 : 1) :
                  (a.bounds.left > b.bounds.left ? -1 : 1)
            case SORT_TOP_TO_BOTTOM:
               return a.bounds.top === b.bounds.top ?
                  (a.bounds.left > b.bounds.left ? -1 : 1) :
                  (a.bounds.top > b.bounds.top ? -1 : 1)
            case SORT_BOTTOM_TO_TOP:
               return a.bounds.top === b.bounds.top ?
                  (a.bounds.left > b.bounds.left ? -1 : 1) :
                  (a.bounds.top > b.bounds.top ? 1 : -1)
            default:
               return 0;
         }
      })
   }

   load_tile_sets = () => {
      const {level} = this.props;
      FractoIndexedTiles.load_short_codes(BIN_VERB_READY, ready_short_codes => {
         console.log("ready_short_codes.length", ready_short_codes.length)
         const ready_tiles = ready_short_codes
            .filter(sc => sc.length === level)
            .map((short_code, i) => {
               return {
                  bounds: FractoUtil.bounds_from_short_code(short_code),
                  short_code: short_code
               }
            })
         this.setState({
            ready_tiles: this.sort_tiles(ready_tiles),
            ready_loading: false,
         })
         FractoIndexedTiles.load_short_codes(BIN_VERB_INLAND, inland_short_codes => {
            console.log("inland_short_codes.length", inland_short_codes.length)
            const inland_tiles = inland_short_codes
               .filter(sc => sc.length === level)
               .map((short_code, i) => {
                  return {
                     bounds: FractoUtil.bounds_from_short_code(short_code),
                     short_code: short_code
                  }
               })
            this.setState({
               inland_tiles: this.sort_tiles(inland_tiles),
               inland_loading: false,
            })
         })
      })
   }

   test_edge_case = (tile, tile_data) => {
      if (tile.bounds.bottom === 0) {
         // console.log("will not edge bottom tile");
         return false
      }
      const [pattern0, iterations0] = tile_data[0][0];
      for (let img_x = 0; img_x < 256; img_x++) {
         for (let img_y = 0; img_y < 256; img_y++) {
            const [pattern, iterations] = tile_data[img_x][img_y];
            if (iterations !== iterations0 && pattern !== pattern0) {
               // console.log("not on edge");
               return false;
            }
         }
      }
      console.log("all points are", iterations0);
      return true
   }

   compare_tile_data = (points_1, points_2) => {
      if (!points_1) {
         debugger;
         return false
      }
      if (!points_2) {
         debugger;
         return false
      }
      if (points_1.length !== 256) {
         debugger;
         return false
      }
      if (points_2.length !== 256) {
         debugger;
         return false
      }
      for (let img_x = 0; img_x < 256; img_x++) {
         if (points_1[img_x].length !== 256) {
            debugger;
            return false
         }
         if (points_2[img_x].length !== 256) {
            debugger;
            return false
         }
         for (let img_y = 0; img_y < 256; img_y++) {
            if (points_1[img_x][img_y].length !== 2) {
               debugger;
               return false;
            }
            if (points_2[img_x][img_y].length !== 2) {
               debugger;
               return false;
            }
            if (points_1[img_x][img_y][0] !== points_2[img_x][img_y][0]) {
               debugger;
               return false
            }
            if (points_1[img_x][img_y][1] !== points_2[img_x][img_y][1]) {
               debugger;
               return false
            }
         }
      }
      return true;
   }

   generate_tile = (tile, cb) => {
      const start = performance.now()
      const tile_points = FractoTileGenerate.prepare_tile()
      this.setState({tile_points: tile_points})
      let tile_copy = JSON.parse(JSON.stringify(tile))
      FractoTileGenerate.generate_tile(tile_copy, tile_points, response => {
         const is_edge_tile = this.test_edge_case(tile, tile_points);
         if (is_edge_tile) {
            FractoUtil.empty_tile(tile.short_code, result => {
               console.log("FractoUtil.empty_tile", tile.short_code, result);
               const full_history = [response, result].join(', ')
               cb(full_history)
            })
         } else {
            FractoUtil.tile_to_bin(tile.short_code, "complete", "indexed", result => {
               console.log("FractoUtil.tile_to_bin", tile.short_code, "complete", "indexed", result);
               const end = performance.now()
               const timing = `in ${Math.round((end - start)) / 1000}s`
               setTimeout(() => {
                  FractoMruCache.get_tile_data_raw(tile.short_code, data => {
                     console.log(`get_tile_data_raw ${tile.short_code}`, data ? data.length : 0)
                     const success = this.compare_tile_data(tile_points, data) ?
                        'with success' : 'with no success'
                     const full_history = [response, result.result, timing, success].join(', ')
                     cb(full_history)
                  })
               }, 50)
            })
         }
      })
   }

   on_render_tile = (tile, width_px) => {
      const {tile_points} = this.state
      if (!tile_points) {
         return <CoolStyles.InlineBlock style={{width: `${width_px}px`}}>
            {'no tile points'}
         </CoolStyles.InlineBlock>
      }
      return <FractoTileRender
         key={`render-${tile.short_code}`}
         tile={tile}
         width_px={width_px}
         tile_data={tile_points}/>
   }

   on_select_tile = (tile, cb = null) => {
      if (!tile) {
         if (cb) {
            cb(false)
         }
         return
      }
      console.log("on_select_tile", tile)
      FractoMruCache.get_tile_data(tile.short_code, tile_points => {
         this.setState({tile_points: tile_points})
         if (cb) {
            cb('tile selected')
         }
      })
   }

   on_sort_extra = (new_sort_extra) => {
      const {inland_loading, ready_loading} = this.state
      const {level} = this.props;
      if (inland_loading || ready_loading) {
         return
      }
      this.setState({
         sort_extra: new_sort_extra,
         ready_loading: true,
         inland_loading: true
      })
      localStorage.setItem(`${LS_KEY_SORT_EXTRA}_${level}`, new_sort_extra)
      setTimeout(() => {
         this.load_tile_sets()
      }, 500)
   }

   on_render_detail = () => {
      const {sort_extra} = this.state
      const extra_options = [
         {label: "left to right", value: SORT_LEFT_TO_RIGHT},
         {label: "right to left", value: SORT_RIGHT_TO_LEFT},
         {label: "top to bottom", value: SORT_TOP_TO_BOTTOM},
         {label: "bottom to top", value: SORT_BOTTOM_TO_TOP}
      ]
      return <CoolStyles.Block>
         <SelectWrapper><CoolSelect
            options={extra_options}
            value={sort_extra}
            on_change={e => this.on_sort_extra(e.target.value)}/>
         </SelectWrapper>
      </CoolStyles.Block>
   }

   render() {
      const {ready_loading, inland_loading, ready_tiles} = this.state
      const {level, width_px} = this.props;
      if (ready_loading || inland_loading) {
         return FractoCommon.loading_wait_notice(`FieldNextGen: ready is ${ready_loading ? 'in progress' : 'complete'}, inland is ${ready_loading ? 'waiting' : 'in progress'}`)
      }
      return <FractoTileAutomator
         all_tiles={ready_tiles}
         level={level}
         tile_action={this.generate_tile}
         descriptor={"next-gen"}
         width_px={width_px}
         on_render_tile={this.on_render_tile}
         on_select_tile={this.on_select_tile}
         on_render_detail={this.on_render_detail}
         auto_refresh={10000}
      />
   }
}

export default FieldNextGen;
