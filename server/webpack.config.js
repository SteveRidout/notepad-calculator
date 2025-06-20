const nodeExternals = require("webpack-node-externals");
const path = require("path");

const mode =
  process.env.NODE_ENV === "production" ? "production" : "development";

module.exports = {
  devtool: "source-map",
  entry: ["./src/server.ts"],
  externals: nodeExternals(),
  mode,
  output: {
    filename: "serverBundle.js",
    path: path.resolve(__dirname, "dist"),
  },
  resolve: {
    extensions: ["", ".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  target: "node",
};
