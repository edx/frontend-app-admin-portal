// This is the prod Webpack config. All settings here should prefer smaller,
// optimized bundles at the expense of a longer build time.
const { merge } = require('webpack-merge');
const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackNewRelicPlugin = require('html-webpack-new-relic-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const OptimizeCssnanoPlugin = require('@intervolga/optimize-cssnano-plugin');
const dotenv = require('dotenv');
const Dotenv = require('dotenv-webpack');
const commonConfig = require('./webpack.common.config.js');

// Add process env vars. Currently used only for setting the
// server port and the publicPath
const result = dotenv.config({
  path: path.resolve(process.cwd(), '.env'),
});

if (result.error) {
  throw result.error;
}

module.exports = merge(commonConfig, {
  mode: 'production',
  devtool: 'source-map',
  output: {
    filename: '[name].[chunkhash].js',
  },
  module: {
    // Specify file-by-file rules to Webpack. Some file-types need a particular kind of loader.
    rules: [
      // The babel-loader transforms newer ES2015+ syntax to older ES5 for older browsers.
      // Babel is configured with the .babelrc file at the root of the project.
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules\/(?!edx)/,
        loader: 'babel-loader',
        options: {
          compact: true,
        },
      },
      // Webpack, by default, includes all CSS in the javascript bundles. Unfortunately, that means:
      // a) The CSS won't be cached by browsers separately (a javascript change will force CSS
      // re-download).  b) Since CSS is applied asyncronously, it causes an ugly
      // flash-of-unstyled-content.
      //
      // To avoid these problems, we extract the CSS from the bundles into separate CSS files that
      // can be included as <link> tags in the HTML <head> manually.
      //
      // We will not do this in development because it prevents hot-reloading from working and it
      // increases build time.
      {
        test: /(.scss|.css)$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader', // translates CSS into CommonJS
          },
          {
            loader: 'sass-loader', // compiles Sass to CSS
            options: {
              sassOptions: {
                includePaths: [
                  path.join(__dirname, '../node_modules'),
                  path.join(__dirname, '../src'),
                ],
              },
            },
          },
        ],
      },
      // Webpack, by default, uses the url-loader for images and fonts that are required/included by
      // files it processes, which just base64 encodes them and inlines them in the javascript
      // bundles. This makes the javascript bundles ginormous and defeats caching so we will use the
      // file-loader instead to copy the files directly to the output directory.
      {
        test: /\.(woff2?|ttf|svg|eot)(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'file-loader',
      },
      {
        test: /\.(jpe?g|png|gif|ico)(\?v=\d+\.\d+\.\d+)?$/,
        use: [
          'file-loader',
          {
            loader: 'image-webpack-loader',
            options: {
              optimizationlevel: 7,
              mozjpeg: {
                progressive: true,
              },
              gifsicle: {
                interlaced: false,
              },
              pngquant: {
                quality: [0.65, 0.90],
                speed: 4,
              },
            },
          },
        ],
      },
    ],
  },
  // New in Webpack 4. Replaces CommonChunksPlugin. Extract common modules among all chunks to one
  // common chunk and extract the Webpack runtime to a single runtime chunk.
  optimization: {
    runtimeChunk: 'single',
    splitChunks: {
      cacheGroups: {
        styles: {
          name: 'styles',
          test: /\.css$/,
          chunks: 'all',
          enforce: true,
        },
      },
    },
  },
  // Specify additional processing or side-effects done on the Webpack output bundles as a whole.
  plugins: [
    // Cleans the dist directory before each build
    new CleanWebpackPlugin(),
    // Writes the extracted CSS from each entry to a file in the output directory.
    new MiniCssExtractPlugin({
      filename: '[name].[chunkhash].css',
    }),
    // Minimizes the extracted CSS with cssnano and solves CSS duplication
    // issue with `extract-text-webpack-plugin`.
    new OptimizeCssnanoPlugin({
      sourceMap: true,
      cssnanoOptions: {
        preset: ['default', {
          discardComments: {
            removeAll: true,
          },
        }],
      },
    }),
    // Generates an HTML file in the output directory.
    new HtmlWebpackPlugin({
      inject: true, // Appends script tags linking to the webpack bundles at the end of the body
      template: path.resolve(__dirname, '../public/index.html'),
      FAVICON_URL: process.env.FAVICON_URL || null,
    }),
    new Dotenv({
      path: path.resolve(process.cwd(), '../.env'),
      systemvars: true,
    }),
    new webpack.EnvironmentPlugin({
      FEATURE_FLAGS: {
        CODE_MANAGEMENT: true,
        REPORTING_CONFIGURATIONS: true,
        ANALYTICS: false,
        SUPPORT: true,
        SAML_CONFIGURATION: true,
        CODE_VISIBILITY: false,
        EXTERNAL_LMS_CONFIGURATION: true,
      },
    }),
    new HtmlWebpackNewRelicPlugin({
      // we use non empty strings as defaults here to prevent errors for empty configs
      license: process.env.NEW_RELIC_LICENSE_KEY || 'fake_app',
      applicationID: process.env.NEW_RELIC_APP_ID || 'fake_license',
    }),
  ],
});
