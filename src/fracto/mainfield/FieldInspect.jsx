import {Component} from 'react';
import PropTypes from 'prop-types';
// import styled from "styled-components";
//
// import {CoolStyles} from 'common/ui/CoolImports';

export class FieldInspect extends Component {

   static propTypes = {
      level: PropTypes.number.isRequired,
      width_px: PropTypes.number.isRequired,
   }

   state = {};

   componentDidMount() {
      const {level} = this.props;
      const previous_state = localStorage.getItem(`inspect_state_${level}`)
      if (previous_state) {
         this.setState(JSON.parse(previous_state));
      }
   }

   render() {
      const {level, width_px} = this.props;
      return `FieldInspect ${level} ${width_px}`
   }
}

export default FieldInspect;
