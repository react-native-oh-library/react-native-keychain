
import React, { PureComponent } from "react";
import { ViewPropTypes, NativeModules, Platform } from "react-native";
import PropTypes from "prop-types";
import { TurboModuleRegistry } from 'react-native';
const RNFileSelector = TurboModuleRegistry ? TurboModuleRegistry.get('RNFileSelector') : NativeModules.RNFileSelector;

class FileSelector extends PureComponent {
  static propTypes = {
    ...ViewPropTypes,

    filter: PropTypes.string,
    path: PropTypes.string,
    onDone: PropTypes.func,
    onCancel: PropTypes.func,
  };

  static defaultProps = {
    filter: '',
    path: '',
  };

  static Show(props) {
    if (props.filter === undefined) {
        props.filter = FileSelector.defaultProps.filter
    } if (props.path === undefined) {
        props.path = FileSelector.defaultProps.path;
    } 

    RNFileSelector.Show(props, path => {
        props.onDone && props.onDone(path)
      }, () => {
        props.onCancel && props.onCancel()
      });
  }

  componentDidMount() {
    this._show();
  }

  componentDidUpdate() {
    this._show();
  }

  _show() {
    FileSelector.Show({
      filter: this.props.filter,
      path: this.props.path,
      onDone: this.props.onDone,
      onCancel: this.props.onCancel
    });
  }

  render() {
    return null;
  }
}

export default FileSelector;