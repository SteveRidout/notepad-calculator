const CopyWebpackPlugin = require("copy-webpack-plugin");
const path = require("path");

const mode =
  process.env.NODE_ENV === "production" ? "production" : "development";

module.exports = {
  devtool: "source-map",
  entry: ["./src/index.tsx"],
  mode,
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
  },
  resolve: {
    extensions: ["", ".ts", ".tsx", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.s?css$/i,
        use: [
          "style-loader",
          {
            loader: "css-loader",
            options: {
              modules: {
                localIdentName:
                  mode === "development"
                    ? "[path][name]__[local]"
                    : "[hash:base64]",
              },
            },
          },
          "sass-loader",
        ],
      },
    ],
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        // {
        //   from: "static/index.html",
        //   to: "index.html",
        // },
        {
          from: "static",
          to: "",
        },
      ],
    }),
  ],
  stats: {
    assets: false,
  },
};
