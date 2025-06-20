import { Component } from "preact";
import { route } from "preact-router";

interface Props {
  to: string;
}

export default class Redirect extends Component<Props> {
  componentWillMount() {
    console.log("redirect props: ", this.props);

    // XXX For some reason the following commented-out line doesn't work:
    // route(this.props.to, true);
    //
    // So going with this instead:
    window.location.pathname = "/";
  }

  render() {
    return null;
  }
}
