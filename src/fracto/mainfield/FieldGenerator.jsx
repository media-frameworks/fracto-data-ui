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

const SORT_TYPE_RADIAL = "sort_type_radial"
const SORT_TYPE_CARTESIAN = "sort_type_cartesian"

const TILE_OPTION_INLAND = "tile_option_inland"
const TILE_OPTION_NO_INLAND = "tile_option_no_inland"
const TILE_OPTION_ALL_TILES = "tile_option_all_tiles"

const SORT_LEFT_TO_RIGHT = "sort_left_to_right"
const SORT_RIGHT_TO_LEFT = "sort_right_to_left"
const SORT_TOP_TO_BOTTOM = "sort_top_to_bottom"
const SORT_BOTTOM_TO_TOP = "sort_bottom_to_top"

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
      tile_option: TILE_OPTION_INLAND
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
      const {tile_option} = this.state
      const {level} = this.props;
      if (tile_option === TILE_OPTION_NO_INLAND || tile_option === TILE_OPTION_ALL_TILES) {
         FractoDataLoader.load_tile_set_async(BIN_VERB_READY, result => {
            const ready_tiles = FractoData.get_cached_tiles(level, BIN_VERB_READY)
            console.log("FractoDataLoader.load_tile_set_async", BIN_VERB_READY, result.length)
            if (tile_option === TILE_OPTION_ALL_TILES) {
               this.merge_tiles(this.state.inland_tiles, ready_tiles)
            } else {
               this.merge_tiles([], ready_tiles)
            }
            this.setState({
               ready_loading: false,
               ready_tiles: ready_tiles
            });
         })
      } else {
         this.setState({
            ready_loading: false,
            ready_tiles: []
         });
      }
      if (tile_option === TILE_OPTION_INLAND || tile_option === TILE_OPTION_ALL_TILES) {
         FractoDataLoader.load_tile_set_async(BIN_VERB_INLAND, result => {
            const inland_tiles = FractoData.get_cached_tiles(level, BIN_VERB_INLAND)
            console.log("FractoDataLoader.load_tile_set_async", BIN_VERB_INLAND, result.length)
            if (tile_option === TILE_OPTION_ALL_TILES) {
               this.merge_tiles(this.state.ready_tiles, inland_tiles)
            } else {
               this.merge_tiles([], inland_tiles)
            }
            this.setState({
               inland_loading: false,
               inland_tiles: inland_tiles
            });
         })
      } else {
         this.setState({
            inland_loading: false,
            inland_tiles: []
         });
      }
   }

   merge_tiles = (set_1, set_2) => {
      const {sort_extra, sort_type} = this.state
      const all_tiles = set_1.concat(set_2).sort((a, b) => {
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
      this.setState({all_tiles: all_tiles})
   }

   on_sort_extra = (new_sort_extra) => {
      const {inland_loading, ready_loading} = this.state
      if (inland_loading || ready_loading) {
         return
      }
      let new_state = Object.assign({}, BLANK_SLATE)
      new_state.sort_extra = new_sort_extra
      this.setState(new_state)
      console.log("new_state", new_state)
      setTimeout(() => {
         this.initalize_tile_sets()
      }, 500)
   }

   on_sort_type = (new_sort_type) => {
      const {inland_loading, ready_loading} = this.state
      if (inland_loading || ready_loading) {
         return
      }
      let new_state = Object.assign({}, BLANK_SLATE)
      new_state.sort_type = new_sort_type
      console.log("new_state", new_state)
      this.setState(new_state)
      setTimeout(() => {
         this.initalize_tile_sets()
      }, 500)
   }

   on_tile_option = (new_tile_option) => {
      const {inland_loading, ready_loading} = this.state
      if (inland_loading || ready_loading) {
         return
      }
      let new_state = Object.assign({}, BLANK_SLATE)
      new_state.tile_option = new_tile_option
      console.log("new_state", new_state)
      this.setState(new_state)
      setTimeout(() => {
         this.initalize_tile_sets()
      }, 500)
   }

   on_render_detail = (tile, detail_width_px) => {
      const {sort_type, sort_extra, tile_option} = this.state
      const type_options = [
         {label: "radial", value: SORT_TYPE_RADIAL, help: "outside-in"},
         {label: "cartesian", value: SORT_TYPE_CARTESIAN, help: "follow grid"},
      ]
      const tile_options = [
         {label: "only inland", value: TILE_OPTION_INLAND},
         {label: "excepting inland", value: TILE_OPTION_NO_INLAND},
         {label: "all tiles", value: TILE_OPTION_ALL_TILES},
      ]
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
      console.log("sort_type, sort_extra, tile_option", sort_type, sort_extra, tile_option)
      return <CoolStyles.Block>
         <SelectWrapper><CoolSelect
            options={type_options}
            value={sort_type}
            on_change={e => this.on_sort_type(e.target.value)}/>
         </SelectWrapper>
         {extra_select}
         <SelectWrapper><CoolSelect
            options={tile_options}
            value={tile_option}
            on_change={e => this.on_tile_option(e.target.value)}/>
         </SelectWrapper>
      </CoolStyles.Block>
   }

   render() {
      const {ready_loading, inland_loading, all_tiles} = this.state;
      const {level, width_px} = this.props;
      if (ready_loading || inland_loading) {
         return FractoCommon.loading_wait_notice()
      }
      return <FractoTileAutomator
         all_tiles={all_tiles}
         level={level}
         tile_action={FractoTileGenerate.generate_tile}
         descriptor={"generator"}
         width_px={width_px}
         on_render_detail={(tile, detail_width_px) => this.on_render_detail(tile, detail_width_px)}
      />
   }
}

export default FieldGenerator;
