import { Component } from "preact";

interface Props {
  path?: string;
  to: string;
}

export default class Redirect extends Component<Props> {
  componentWillMount() {
    window.location.pathname = this.props.to;
  }

  render() {
    return null;
  }
}
