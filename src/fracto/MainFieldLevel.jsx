import {Component} from 'react';
import PropTypes from 'prop-types';
// import styled from "styled-components";
//
// import {CoolStyles} from 'common/ui/CoolImports';

export class MainFieldLevel extends Component {

   static propTypes = {
      level_specifier: PropTypes.string.isRequired,
      width_px: PropTypes.number.isRequired,
   }

   state = {
   };

   render() {
      const {level_specifier, width_px} = this.props;
      return `MainFieldLevel level${level_specifier} (${width_px}px)`;
   }
}

export default MainFieldLevel;
