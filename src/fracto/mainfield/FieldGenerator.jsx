import {Component} from 'react';
import PropTypes from 'prop-types';
import styled from "styled-components";

import {CoolSelect, CoolStyles} from "../../common/ui/CoolImports";

import FractoData, {BIN_VERB_INLAND, BIN_VERB_READY} from 'fracto/common/data/FractoData';
import FractoDataLoader from 'fracto/common/data/FractoDataLoader';
import FractoCommon from 'fracto/common/FractoCommon';
import FractoUtil from 'fracto/common/FractoUtil';

import FractoTileAutomator from "../common/tile/FractoTileAutomator";
import FractoTileGenerate from "../common/tile/FractoTileGenerate";
import FractoTileRender from "../common/tile/FractoTileRender";

const SORT_TYPE_RADIAL = "sort_type_radial"
const SORT_TYPE_CARTESIAN = "sort_type_cartesian"
const SORT_TYPE_NO_PATTERNS = "sort_type_no_patterns"
const SORT_TYPE_INNER_EDGE = "sort_type_inner_edge"

const TILE_OPTION_INLAND = "tile_option_inland"
const TILE_OPTION_NO_INLAND = "tile_option_no_inland"
const TILE_OPTION_ALL_TILES = "tile_option_all_tiles"

const SORT_LEFT_TO_RIGHT = "sort_left_to_right"
const SORT_RIGHT_TO_LEFT = "sort_right_to_left"
const SORT_TOP_TO_BOTTOM = "sort_top_to_bottom"
const SORT_BOTTOM_TO_TOP = "sort_bottom_to_top"

const LS_KEY_SORT_TYPE = 'LS_KEY_SORT_TYPE'
const LS_KEY_SORT_EXTRA = 'LS_KEY_SORT_EXTRA'
const LS_KEY_TILE_OPTION = 'LS_KEY_TILE_OPTION'

const BLANK_SLATE = {
   ready_tiles: [],
   inland_tiles: [],
   all_tiles: [],
   ready_loading: true,
   inland_loading: true,
}

const SelectWrapper = styled(CoolStyles.InlineBlock)`
   margin-right: 0.5rem;
`

export class FieldGenerator extends Component {

   static propTypes = {
      level: PropTypes.number.isRequired,
      width_px: PropTypes.number.isRequired,
   }

   state = {
      ready_tiles: [],
      inland_tiles: [],
      all_tiles: [],
      ready_loading: true,
      inland_loading: true,
      sort_type: SORT_TYPE_RADIAL,
      sort_extra: SORT_LEFT_TO_RIGHT,
      tile_option: TILE_OPTION_NO_INLAND,
      tile_points: null
   };

   componentDidMount() {
      const {level} = this.props;
      const sort_type = localStorage.getItem(`${LS_KEY_SORT_TYPE}_${level}`)
      const sort_extra = localStorage.getItem(`${LS_KEY_SORT_EXTRA}_${level}`)
      const tile_option = localStorage.getItem(`${LS_KEY_TILE_OPTION}_${level}`)
      this.setState({
         sort_type: sort_type ? sort_type : SORT_TYPE_RADIAL,
         sort_extra: sort_extra ? sort_extra : SORT_LEFT_TO_RIGHT,
         tile_option: tile_option ? tile_option : TILE_OPTION_NO_INLAND
      })

      setTimeout(() => {
         this.initalize_tile_sets()
      }, 350)
   }

   componentDidUpdate(prevProps: Readonly<P>, prevState: Readonly<S>, snapshot: SS) {
      const {level} = this.props;
      if (prevProps.level !== this.props.level) {
         FractoDataLoader.load_tile_set_async(BIN_VERB_READY, result => {
            console.log("FractoDataLoader.load_tile_set_async", BIN_VERB_READY, result)
            const ready_tiles = FractoData.get_cached_tiles(level, BIN_VERB_READY, true)
            console.log("READY tiles count", ready_tiles.length)
            this.setState({
               ready_tiles: ready_tiles,
               ready_tiles_loaded: true,
               tile_index: 0,
            });
         });
         FractoDataLoader.load_tile_set_async(BIN_VERB_INLAND, result => {
            console.log("FractoDataLoader.load_tile_set_async", BIN_VERB_INLAND, result)
            const inland_tiles = FractoData.get_cached_tiles(level, BIN_VERB_INLAND)
            console.log("inland tiles count", inland_tiles.length)
            this.setState({
               inland_tiles: inland_tiles,
               inland_tiles_loaded: true
            });
         });
         this.initalize_tile_sets()
      }
   }

   process_no_patterns = () => {
      const {level} = this.props;
      const ready_tiles = FractoData.get_cached_tiles(level, BIN_VERB_READY)
      const that = this;
      fetch(`easiest_${level - 1}.csv`)
         .then(function (response) {
            return response.text()
         })
         .then(function (response) {
            const parent_short_codes = response.split("\n");
            let keyed_codes = {}
            parent_short_codes.forEach((code, i) => {
               keyed_codes[code] = i
            })
            const no_pattern_tiles = ready_tiles.filter(tile => {
               const parent_short_code = tile.short_code.substring(0, level - 1)
               return keyed_codes[parent_short_code]
            }).sort((a, b) => {
               const parent_short_code_a = a.short_code.substring(0, level - 1)
               const parent_short_code_b = b.short_code.substring(0, level - 1)
               return keyed_codes[parent_short_code_a] - keyed_codes[parent_short_code_b]
            })
            console.log("no_pattern_tiles", no_pattern_tiles)
            that.setState({
               ready_loading: false,
               all_tiles: no_pattern_tiles
            });
         })
   }

   process_inner_edge = () => {
      const {level} = this.props;
      const inland_tiles = FractoData.get_cached_tiles(level, BIN_VERB_INLAND)
      const that = this;
      fetch(`all_patterns_${level - 1}.csv`)
         .then(function (response) {
            return response.text()
         })
         .then(function (response) {
            const parent_short_codes = response.split("\n");
            console.log("parent_short_codes count", parent_short_codes.length)
            let keyed_codes = {}
            parent_short_codes.forEach((code, i) => {
               keyed_codes[code] = i
            })
            const all_pattern_tiles = inland_tiles.filter(tile => {
               const parent_short_code = tile.short_code.substring(0, level - 1)
               return keyed_codes[parent_short_code]
            }).sort((a, b) => {
               const parent_short_code_a = a.short_code.substring(0, level - 1)
               const parent_short_code_b = b.short_code.substring(0, level - 1)
               return keyed_codes[parent_short_code_a] - keyed_codes[parent_short_code_b]
            })
            console.log("all_pattern_tiles", all_pattern_tiles)
            that.setState({
               inland_loading: false,
               all_tiles: all_pattern_tiles
            });
         })
   }

   initalize_tile_sets = () => {
      const {tile_option, sort_type} = this.state
      const {level} = this.props;

      console.log("tile_option,sort_type", tile_option, sort_type)
      if (tile_option === TILE_OPTION_NO_INLAND ||
         tile_option === TILE_OPTION_ALL_TILES ||
         sort_type === SORT_TYPE_NO_PATTERNS) {
         console.log("case 1")
         FractoDataLoader.load_tile_set_async(BIN_VERB_READY, result => {
            let ready_tiles = []
            if (sort_type === SORT_TYPE_NO_PATTERNS) {
               this.process_no_patterns()
            } else {
               ready_tiles = FractoData.get_cached_tiles(level, BIN_VERB_READY)
               console.log("FractoDataLoader.load_tile_set_async", BIN_VERB_READY, result.length)
               let all_tiles = []
               if (tile_option === TILE_OPTION_ALL_TILES) {
                  all_tiles = this.merge_tiles(this.state.inland_tiles, ready_tiles)
               } else {
                  all_tiles =this.merge_tiles([], ready_tiles)
               }
               this.setState({
                  ready_loading: false,
                  ready_tiles: ready_tiles,
                  all_tiles: all_tiles
               });
            }
         })
      } else {
         console.log("not readys")
         this.setState({
            ready_loading: false,
            ready_tiles: []
         });
      }

      if (tile_option === TILE_OPTION_INLAND ||
         tile_option === TILE_OPTION_ALL_TILES ||
         sort_type === SORT_TYPE_INNER_EDGE) {
         console.log("case 2")

         FractoDataLoader.load_tile_set_async(BIN_VERB_INLAND, result => {
            let inland_tiles = []
            if (sort_type === SORT_TYPE_INNER_EDGE) {
               this.process_inner_edge()
            } else {
               inland_tiles = FractoData.get_cached_tiles(level, BIN_VERB_INLAND)
               console.log("FractoDataLoader.load_tile_set_async", BIN_VERB_INLAND, result.length)
               let all_tiles = []
               if (tile_option === TILE_OPTION_ALL_TILES) {
                  all_tiles = this.merge_tiles(this.state.ready_tiles, inland_tiles)
               } else {
                  all_tiles = this.merge_tiles([], inland_tiles)
               }
               this.setState({
                  inland_loading: false,
                  inland_tiles: inland_tiles,
                  all_tiles: all_tiles
               });
            }
         })
      } else {
         console.log("not inlandss")
         this.setState({
            inland_loading: false,
            inland_tiles: []
         });
      }
   }

   merge_tiles = (set_1, set_2) => {
      const {sort_extra, sort_type} = this.state
      return set_1.concat(set_2).sort((a, b) => {
         const a_bounds = FractoUtil.bounds_from_short_code(a.short_code)
         const b_bounds = FractoUtil.bounds_from_short_code(b.short_code)
         if (sort_type === SORT_TYPE_RADIAL) {
            const a_left = a_bounds.left + 0.25
            const b_left = b_bounds.left + 0.25
            const a_distance = Math.sqrt(a_left * a_left + a_bounds.top * a_bounds.top)
            const b_distance = Math.sqrt(b_left * b_left + b_bounds.top * b_bounds.top)
            return a_distance > b_distance ? -1 : 1
         } else {
            switch (sort_extra) {
               case SORT_LEFT_TO_RIGHT:
                  return a_bounds.left === b_bounds.left ?
                     (a_bounds.top > b_bounds.top ? -1 : 1) :
                     (a_bounds.left > b_bounds.left ? 1 : -1)
               case SORT_RIGHT_TO_LEFT:
                  return a_bounds.left === b_bounds.left ?
                     (a_bounds.top > b_bounds.top ? -1 : 1) :
                     (a_bounds.left > b_bounds.left ? -1 : 1)
               case SORT_TOP_TO_BOTTOM:
                  return a_bounds.top === b_bounds.top ?
                     (a_bounds.left > b_bounds.left ? -1 : 1) :
                     (a_bounds.top > b_bounds.top ? -1 : 1)
               case SORT_BOTTOM_TO_TOP:
                  return a_bounds.top === b_bounds.top ?
                     (a_bounds.left > b_bounds.left ? -1 : 1) :
                     (a_bounds.top > b_bounds.top ? 1 : -1)
               default:
                  return 0;
            }
         }
      })
   }

   on_sort_extra = (new_sort_extra) => {
      const {inland_loading, ready_loading} = this.state
      const {level} = this.props;
      if (inland_loading || ready_loading) {
         return
      }
      let new_state = Object.assign({}, BLANK_SLATE)
      new_state.sort_extra = new_sort_extra
      this.setState(new_state)
      localStorage.setItem(`${LS_KEY_SORT_EXTRA}_${level}`, new_sort_extra)
      console.log("new_state", new_state)
      setTimeout(() => {
         this.initalize_tile_sets()
      }, 500)
   }

   on_sort_type = (new_sort_type) => {
      const {inland_loading, ready_loading} = this.state
      const {level} = this.props;
      if (inland_loading || ready_loading) {
         return
      }
      let new_state = Object.assign({}, BLANK_SLATE)
      new_state.sort_type = new_sort_type
      console.log("new_state", new_state)
      this.setState(new_state)
      localStorage.setItem(`${LS_KEY_SORT_TYPE}_${level}`, new_sort_type)
      setTimeout(() => {
         this.initalize_tile_sets()
      }, 500)
   }

   on_tile_option = (new_tile_option) => {
      const {inland_loading, ready_loading} = this.state
      const {level} = this.props;
      if (inland_loading || ready_loading) {
         return
      }
      let new_state = Object.assign({}, BLANK_SLATE)
      new_state.tile_option = new_tile_option
      console.log("new_state", new_state)
      this.setState(new_state)
      localStorage.setItem(`${LS_KEY_TILE_OPTION}_${level}`, new_tile_option)
      setTimeout(() => {
         this.initalize_tile_sets()
      }, 500)
   }

   on_render_detail = (tile, detail_width_px) => {
      const {sort_type, sort_extra, tile_option} = this.state
      const type_options = [
         {label: "radial", value: SORT_TYPE_RADIAL, help: "outside-in"},
         {label: "cartesian", value: SORT_TYPE_CARTESIAN, help: "follow grid"},
         {label: "easy first", value: SORT_TYPE_NO_PATTERNS, help: "no patterns"},
         {label: "inner edge", value: SORT_TYPE_INNER_EDGE, help: "all patterns"},
      ]
      let extra_options = ''
      if (sort_type !== SORT_TYPE_NO_PATTERNS && sort_type !== SORT_TYPE_INNER_EDGE) {
         const tile_options = [
            {label: "only inland", value: TILE_OPTION_INLAND},
            {label: "excepting inland", value: TILE_OPTION_NO_INLAND},
            {label: "all tiles", value: TILE_OPTION_ALL_TILES},
         ]
         extra_options = <SelectWrapper><CoolSelect
            options={tile_options}
            value={tile_option}
            on_change={e => this.on_tile_option(e.target.value)}/>
         </SelectWrapper>
      }
      let extra_select = ''
      if (sort_type === SORT_TYPE_CARTESIAN) {
         const extra_options = [
            {label: "left to right", value: SORT_LEFT_TO_RIGHT},
            {label: "right to left", value: SORT_RIGHT_TO_LEFT},
            {label: "top to bottom", value: SORT_TOP_TO_BOTTOM},
            {label: "bottom to top", value: SORT_BOTTOM_TO_TOP}
         ]
         extra_select = <SelectWrapper><CoolSelect
            options={extra_options}
            value={sort_extra}
            on_change={e => this.on_sort_extra(e.target.value)}/>
         </SelectWrapper>
      }
      // console.log("sort_type, sort_extra, tile_option", sort_type, sort_extra, tile_option)
      return <CoolStyles.Block>
         <SelectWrapper><CoolSelect
            options={type_options}
            value={sort_type}
            on_change={e => this.on_sort_type(e.target.value)}/>
         </SelectWrapper>
         {extra_select}
         {extra_options}
      </CoolStyles.Block>
   }

   generate_tile = (tile, cb) => {
      const {tile_option} = this.state
      const tile_points = FractoTileGenerate.prepare_tile()
      this.setState({tile_points: tile_points})
      let tile_copy = JSON.parse(JSON.stringify(tile))
      tile_copy.inland_tile = tile_option === TILE_OPTION_INLAND
      FractoTileGenerate.generate_tile(tile_copy, tile_points, response => {
         cb(response)
      })
   }

   on_render_tile = (tile, width_px) => {
      const {tile_points} = this.state
      return <FractoTileRender
         key={`render-${tile.short_code}`}
         tile={tile}
         width_px={width_px}
         tile_data={tile_points}/>
   }

   render() {
      const {ready_loading, inland_loading, all_tiles, sort_type,tile_option, inland_tiles, ready_tiles} = this.state;
      const {level, width_px} = this.props;
      if (ready_loading || inland_loading) {
         return FractoCommon.loading_wait_notice()
      }
      if (!all_tiles.length) {
         setTimeout(()=>{
            const automatorTiles = this.merge_tiles(inland_tiles, ready_tiles)
            this.setState({all_tiles: automatorTiles})
         }, 1000)
      }
      return <FractoTileAutomator
         all_tiles={all_tiles}
         level={level}
         tile_action={this.generate_tile}
         descriptor={"generator"}
         width_px={width_px}
         on_render_detail={(tile, detail_width_px) => this.on_render_detail(tile, detail_width_px)}
         on_render_tile={this.on_render_tile}
         auto_refresh={tile_option === TILE_OPTION_INLAND ? 0 : 1500}
      />
   }
}

export default FieldGenerator;
