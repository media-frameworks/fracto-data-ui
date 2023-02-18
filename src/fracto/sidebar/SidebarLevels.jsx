import {Component} from 'react';
import PropTypes from 'prop-types';
// import styled from "styled-components";
//
// import {CoolStyles, CoolTabs} from 'common/ui/CoolImports';

export class SidebarLevels extends Component {

   static propTypes = {
      width_px: PropTypes.number.isRequired,
      item_specifier: PropTypes.string.isRequired,
   }

   state = {};

   render() {
      const {width_px} = this.props;
      return `SidebarLevels ${width_px}`
   }
}

export default SidebarLevels;
