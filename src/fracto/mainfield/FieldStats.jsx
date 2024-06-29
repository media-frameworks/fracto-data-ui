import {Component} from 'react';
import PropTypes from 'prop-types';
import styled from "styled-components";

import network from "common/config/network.json";

import {CoolButton, CoolStyles} from 'common/ui/CoolImports';
import FractoData, {
   BIN_VERB_READY,
   BIN_VERB_INDEXED,
   BIN_VERB_INLAND,
   BIN_VERB_COMPLETED,
   BIN_VERB_ERROR,
   BIN_VERB_POTENTIALS
} from "../common/data/FractoData";
import FractoDataLoader from "../common/data/FractoDataLoader";

const FRACTO_DB_URL = network.db_server_url;

const HeadingWrapper = styled(CoolStyles.Block)`
   ${CoolStyles.bold}
   ${CoolStyles.underline}
   font-size: 1.25rem;
   color: #444444;
   margin: 0.5rem 1rem;
`

const StatWrapper = styled(CoolStyles.Block)`
   ${CoolStyles.bold}
   ${CoolStyles.monospace}
   font-size: 0.90rem;
   color: black;
   margin-left: 1.5rem;
`

const ButtonWrapper = styled(CoolStyles.Block)`
   margin: 0.5rem 1.5rem;
`

export class FieldStats extends Component {

   static propTypes = {
      level: PropTypes.number.isRequired,
      width_px: PropTypes.number.isRequired,
   }

   state = {
      rows: [],
      in_update: false,
      process_result: {},
      update_status: '',
      row_short_codes: []
   };

   componentDidMount() {
      this.fetch_rows()
   }

   componentDidUpdate(prevProps, prevState, snapshot) {
      if (prevProps.level !== this.props.level) {
         this.fetch_rows()
      }
   }

   fetch_rows = () => {
      const {level} = this.props;
      const url = `${FRACTO_DB_URL}/level_tiles?level=${level}`
      fetch(url)
         .then(response => response.text())
         .then((str) => {
            const rows = JSON.parse(str)
            const row_short_codes = rows.map(row => row.short_code)
            this.setState({
               rows: rows,
               row_short_codes: row_short_codes
            })
         })
   }

   add_new_tile = (tile, status, cb) => {
      const url = `${FRACTO_DB_URL}/new_tile`;
      const parent = tile.short_code.substr(0, tile.short_code.length - 1)
      const data = {
         short_code: tile.short_code,
         parent: parent,
         level: tile.short_code.length,
         status: status,
         bounds_left: tile.bounds.left,
         bounds_top: tile.bounds.top,
         bounds_right: tile.bounds.right,
         bounds_bottom: tile.bounds.bottom,
      }
      const data_keys = Object.keys(data)
      const encoded_params = data_keys.map(key => {
         return `${key}=${data[key]}`
      })
      const data_url = `${url}?${encoded_params.join('&')}`
      fetch(data_url, {
         body: JSON.stringify(data), // data you send.
         headers: {'Content-Type': 'application/json'},
         method: 'POST',
         mode: 'no-cors', // no-cors, cors, *same-origin
      }).then(function (response) {
         if (response.body) {
            return response.json();
         }
         return ["ok"];
      }).then(function (json_data) {
         console.log("add_new_tile", url, json_data)
         cb(`tile added: ${tile.short_code}`)
      });
   }

   add_new_tiles = (verb, insert_tiles, cb) => {
      if (!insert_tiles.length) {
         cb("complete")
         return;
      }
      const tile = insert_tiles.shift()
      this.add_new_tile(tile, verb, result => {
         this.add_new_tiles(verb, insert_tiles, cb)
      })
   }

   update_db_status = (verb, verb_tiles, batch_index, cb) => {
      const BATCH_SIZE = 25
      const batch_start = batch_index * BATCH_SIZE
      const batch = verb_tiles
         .slice(batch_start, batch_start + BATCH_SIZE)
         .map(tile => tile.short_code)
      if (!batch.length) {
         cb(`updated ${verb_tiles.length} tiles to ${verb}`)
         return;
      }
      const batch_str = batch.join(',')
      const url = `${FRACTO_DB_URL}/update_status?new_status=${verb}&short_codes=${batch_str}`
      fetch(url)
         .then(response => response.text())
         .then((str) => {
            this.update_db_status(verb, verb_tiles, batch_index + 1, cb)
         })
   }

   process_verbs = (verbs, cb) => {
      const {row_short_codes} = this.state
      const {level} = this.props
      if (!verbs.length) {
         cb("complete")
         return;
      }
      const verb = verbs.shift()
      const update_status = `updating ${verb}...`
      this.setState({update_status: update_status})
      FractoDataLoader.load_tile_set_async(verb, result => {
         const verb_tiles = FractoData.get_cached_tiles(level, verb)
         this.state.process_result[verb] = verb_tiles
         this.setState({process_result: this.state.process_result})
         let update_tiles = []
         let insert_tiles = []
         verb_tiles.forEach(tile => {
            if (row_short_codes.includes(tile.short_code)) {
               update_tiles.push(tile)
            } else {
               insert_tiles.push(tile)
            }
         })
         console.log("inserting tiles", verb, insert_tiles.length)
         this.add_new_tiles(verb, insert_tiles, result => {
            console.log("add_new_tiles status", result)
         })
         console.log("updating tiles", verb, update_tiles.length)
         this.update_db_status(verb, update_tiles, 0, result => {
            console.log("update_db_status", result)
            setTimeout(() => {
               this.process_verbs(verbs, cb)
            }, 1000)
         })
      })
   }

   update_status = () => {
      const {in_update} = this.state
      if (in_update) {
         return;
      }
      const verbs = [
         BIN_VERB_INDEXED,
         BIN_VERB_COMPLETED,
         BIN_VERB_READY,
         BIN_VERB_INLAND,
         BIN_VERB_POTENTIALS,
         BIN_VERB_ERROR,
      ]
      this.setState({
         in_update: true,
         process_result: {}
      })
      this.process_verbs(verbs, result => {
         this.setState({
            in_update: false,
            update_status: `update ${result}`
         })
         console.log(result, this.state.process_result)
      })
   }

   render() {
      const {rows, update_status} = this.state
      const unknown_rows = rows.filter(row => row.status === 'unknown')
      const indexed_rows = rows.filter(row => row.status === BIN_VERB_INDEXED)
      const potentials_rows = rows.filter(row => row.status === BIN_VERB_POTENTIALS)
      return [
         <HeadingWrapper>{`${rows.length} tiles`}</HeadingWrapper>,
         <StatWrapper>{update_status}</StatWrapper>,
         !unknown_rows.length ? '' : <StatWrapper>{`${unknown_rows.length} unknowns`}</StatWrapper>,
         <StatWrapper>{`${indexed_rows.length} indexed`}</StatWrapper>,
         <StatWrapper>{`${potentials_rows.length} potentials`}</StatWrapper>,
         <ButtonWrapper>
            <CoolButton
               content={"update"}
               on_click={e => this.update_status()}
               primary={true}
               disabled={false}
            />
         </ButtonWrapper>
      ]
   }
}

export default FieldStats;
